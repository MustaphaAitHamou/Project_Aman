import type { SupabaseClient } from '@supabase/supabase-js';
import type { Coordinates, WaterPointKind, WaterType } from '@water-finder/core';

import { backendErrorCode, getSupabase } from '@/services/supabase/client';

/**
 * Appels communautaires. Toutes les écritures passent par des fonctions SQL (`submit_*`,
 * `propose_revision`, `register_photo`) qui vérifient l'identité, appliquent les quotas et placent
 * la contribution en modération : l'application ne peut rien publier directement.
 */

export class CommunityError extends Error {
  constructor(
    readonly code: string,
    readonly detail?: string,
  ) {
    super(code);
    this.name = 'CommunityError';
  }
}

function client(): SupabaseClient {
  const supabase = getSupabase();
  if (!supabase) throw new CommunityError('unavailable');
  return supabase;
}

function raise(error: unknown): never {
  const code = backendErrorCode(error);
  const details =
    typeof error === 'object' && error && 'details' in error ? String(error.details) : undefined;
  throw new CommunityError(code, details);
}

export type PotabilityClaim = 'potable' | 'not_potable' | 'unknown';

export interface NewWaterPoint {
  kind: WaterPointKind;
  location: Coordinates;
  name: string;
  waterType: WaterType;
  isFree: boolean | null;
  wheelchairAccessible: boolean | null;
  potabilityClaim: PotabilityClaim;
  comment: string;
}

const orNull = (value: string) => value.trim() || null;

/** Propose un nouveau point (en attente de modération). Renvoie son identifiant. */
export async function submitWaterPoint(input: NewWaterPoint): Promise<string> {
  const { data, error } = await client().rpc('submit_water_point', {
    kind: input.kind,
    latitude: input.location.latitude,
    longitude: input.location.longitude,
    name: orNull(input.name),
    water_type: input.waterType,
    is_free: input.isFree,
    wheelchair_accessible: input.wheelchairAccessible,
    potability_claim: input.potabilityClaim,
    comment: orNull(input.comment),
  });
  if (error) raise(error);
  return String(data);
}

export type ReportType =
  'broken' | 'fixed' | 'not_existing' | 'potability_potable' | 'potability_not_potable' | 'other';

export const REPORT_TYPES: readonly ReportType[] = [
  'broken',
  'fixed',
  'not_existing',
  'potability_not_potable',
  'potability_potable',
  'other',
];

export async function submitReport(pointId: string, type: ReportType, comment: string) {
  const { data, error } = await client().rpc('submit_report', {
    point_id: pointId,
    report_type: type,
    comment: orNull(comment),
  });
  if (error) raise(error);
  return String(data);
}

/** Champs modifiables par une proposition (liste identique à la fonction SQL). */
export interface RevisionChanges {
  name?: string | null;
  kind?: WaterPointKind;
  water_type?: WaterType;
  is_free?: boolean | null;
  wheelchair_accessible?: boolean | null;
  opening_hours?: string | null;
  address?: string | null;
}

export async function proposeRevision(pointId: string, changes: RevisionChanges, comment: string) {
  if (Object.keys(changes).length === 0) throw new CommunityError('no_changes');
  const { data, error } = await client().rpc('propose_revision', {
    point_id: pointId,
    changes,
    comment: orNull(comment),
  });
  if (error) raise(error);
  return String(data);
}

export const PHOTO_BUCKET = 'water-point-photos';

/** Chemin de stockage imposé par les règles : `<uid>/<identifiant>.jpg`. */
export function photoStoragePath(userId: string, id: string): string {
  return `${userId}/${id.replace(/[^A-Za-z0-9_-]/g, '')}.jpg`;
}

const randomId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/**
 * Dépose une photo déjà réencodée en JPEG (métadonnées EXIF, dont la position, supprimées) puis
 * l'enregistre pour modération.
 */
export async function uploadPhoto(
  pointId: string,
  userId: string,
  photo: { uri: string; width: number; height: number },
): Promise<string> {
  const supabase = client();
  const path = photoStoragePath(userId, randomId());
  const body = await (await fetch(photo.uri)).arrayBuffer();
  const upload = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, body, { contentType: 'image/jpeg', upsert: false });
  if (upload.error) raise(upload.error);
  const { data, error } = await supabase.rpc('register_photo', {
    point_id: pointId,
    storage_path: path,
    width: photo.width,
    height: photo.height,
  });
  if (error) {
    await supabase.storage.from(PHOTO_BUCKET).remove([path]);
    raise(error);
  }
  return String(data);
}

/** URL temporaires (1 h) des photos : le compartiment est privé. */
export async function signedPhotoUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data, error } = await client().storage.from(PHOTO_BUCKET).createSignedUrls(paths, 3600);
  if (error) raise(error);
  return Object.fromEntries(
    (data ?? []).flatMap((d) => (d.signedUrl && d.path ? [[d.path, d.signedUrl] as const] : [])),
  );
}

// ── Favoris ──────────────────────────────────────────────────────────────────

export interface FavoriteEntry {
  pointId: string;
  name: string | null;
  kind: WaterPointKind;
  city: string | null;
  createdAt: string;
}

export async function listFavorites(): Promise<FavoriteEntry[]> {
  const { data, error } = await client()
    .from('favorites')
    .select('water_point_id, created_at, water_points(name, kind, city)')
    .order('created_at', { ascending: false });
  if (error) raise(error);
  return (
    (data ?? []) as unknown as {
      water_point_id: string;
      created_at: string;
      water_points: { name: string | null; kind: WaterPointKind; city: string | null } | null;
    }[]
  ).map((row) => ({
    pointId: row.water_point_id,
    name: row.water_points?.name ?? null,
    kind: row.water_points?.kind ?? 'other',
    city: row.water_points?.city ?? null,
    createdAt: row.created_at,
  }));
}

export async function setFavorite(userId: string, pointId: string, favorite: boolean) {
  const table = client().from('favorites');
  const { error } = favorite
    ? await table.upsert(
        { user_id: userId, water_point_id: pointId },
        { onConflict: 'user_id,water_point_id', ignoreDuplicates: true },
      )
    : await table.delete().eq('user_id', userId).eq('water_point_id', pointId);
  if (error) raise(error);
}

// ── Contributions et notifications ───────────────────────────────────────────

export interface Contribution {
  kind: 'water_point' | 'report' | 'revision' | 'photo';
  id: string;
  waterPointId: string | null;
  label: string;
  status: string;
  createdAt: string;
}

export async function myContributions(): Promise<Contribution[]> {
  const { data, error } = await client().rpc('my_contributions', { max_rows: 200 });
  if (error) raise(error);
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    kind: row.kind as Contribution['kind'],
    id: String(row.id),
    waterPointId: row.water_point_id ? String(row.water_point_id) : null,
    label: String(row.label ?? ''),
    status: String(row.status ?? ''),
    createdAt: String(row.created_at),
  }));
}

export interface AppNotification {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export async function listNotifications(): Promise<AppNotification[]> {
  const { data, error } = await client()
    .from('notifications')
    .select('id, type, payload, read_at, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) raise(error);
  return (
    (data ?? []) as {
      id: string;
      type: string;
      payload: Record<string, unknown> | null;
      read_at: string | null;
      created_at: string;
    }[]
  ).map((row) => ({
    id: row.id,
    type: row.type,
    payload: row.payload ?? {},
    readAt: row.read_at,
    createdAt: row.created_at,
  }));
}

export async function markNotificationsRead(): Promise<void> {
  const { error } = await client().rpc('mark_notifications_read');
  if (error) raise(error);
}
