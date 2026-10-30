import type { SupabaseClient } from '@supabase/supabase-js';
import {
  isAvailabilityStatus,
  isOperationalStatus,
  isPotabilityStatus,
  isWaterPointKind,
  isWaterType,
  normalizePotability,
  type DataSourceRef,
  type PotabilityEvidence,
  type SourceCategory,
  type WaterPoint,
  type WaterPointFilters,
  type WaterPointRepository,
  type WaterPointSummary,
} from '@water-finder/core';

/** Ligne renvoyée par water_points_in_bbox / water_points_nearby (type SQL water_point_summary). */
export interface SummaryRow {
  id: string;
  name: string | null;
  kind: string;
  latitude: number;
  longitude: number;
  potability: string;
  operational_status: string;
  availability: string;
  water_type: string;
  is_free: boolean | null;
  wheelchair_accessible: boolean | null;
  last_verified_at: string | null;
  primary_source_category: string;
  distance_meters: number | null;
}

export interface WaterPointPhoto {
  id: string;
  storagePath: string;
  width: number | null;
  height: number | null;
  createdAt: string;
}

export interface RecentReport {
  type: 'broken' | 'fixed' | 'not_existing';
  createdAt: string;
  status: 'pending' | 'approved';
}

/** Fiche complète : point + photos approuvées + derniers signalements. */
export interface WaterPointDetail extends WaterPoint {
  operationalStatusAt: string | null;
  photos: WaterPointPhoto[];
  recentReports: RecentReport[];
  publicationStatus: 'published' | 'pending' | 'rejected' | 'merged';
}

const SOURCE_CATEGORIES: readonly SourceCategory[] = ['official', 'openstreetmap', 'community'];
const asCategory = (value: unknown): SourceCategory =>
  SOURCE_CATEGORIES.includes(value as SourceCategory) ? (value as SourceCategory) : 'community';

/** Conversion défensive : une valeur inattendue devient « inconnu », jamais une valeur favorable. */
export function toSummary(row: SummaryRow): WaterPointSummary {
  return {
    id: row.id,
    name: row.name,
    kind: isWaterPointKind(row.kind) ? row.kind : 'other',
    location: { latitude: Number(row.latitude), longitude: Number(row.longitude) },
    potability: isPotabilityStatus(row.potability) ? row.potability : 'unknown',
    operationalStatus: isOperationalStatus(row.operational_status)
      ? row.operational_status
      : 'unknown',
    availability: isAvailabilityStatus(row.availability) ? row.availability : 'unknown',
    waterType: isWaterType(row.water_type) ? row.water_type : 'unknown',
    isFree: row.is_free,
    wheelchairAccessible: row.wheelchair_accessible,
    lastVerifiedAt: row.last_verified_at,
    primarySourceCategory: asCategory(row.primary_source_category),
  };
}

type DetailJson = Record<string, unknown> & {
  sources?: Record<string, unknown>[];
  photos?: Record<string, unknown>[];
  recent_reports?: Record<string, unknown>[];
  potability_evidence?: Record<string, unknown> | null;
};

const str = (value: unknown): string | null => (typeof value === 'string' ? value : null);
const bool = (value: unknown): boolean | null => (typeof value === 'boolean' ? value : null);

export function toDetail(json: DetailJson): WaterPointDetail {
  const summary = toSummary(json as unknown as SummaryRow);
  const evidenceJson = json.potability_evidence;
  const evidence: PotabilityEvidence | null =
    evidenceJson && typeof evidenceJson === 'object'
      ? {
          kind: (str(evidenceJson.kind) ?? 'community_report') as PotabilityEvidence['kind'],
          sourceName: str(evidenceJson.source_name) ?? '',
          url: str(evidenceJson.url),
          observedAt: str(evidenceJson.observed_at),
        }
      : null;
  const sources: DataSourceRef[] = (json.sources ?? []).map((s) => ({
    category: asCategory(s.category),
    sourceKey: str(s.source_key) ?? '',
    sourceName: str(s.source_name) ?? '',
    externalId: str(s.external_id),
    url: str(s.url),
    license: str(s.license),
    retrievedAt: str(s.retrieved_at),
  }));
  const photos: WaterPointPhoto[] = (json.photos ?? []).map((p) => ({
    id: String(p.id),
    storagePath: String(p.storage_path),
    width: typeof p.width === 'number' ? p.width : null,
    height: typeof p.height === 'number' ? p.height : null,
    createdAt: String(p.created_at),
  }));
  const recentReports: RecentReport[] = (json.recent_reports ?? [])
    .filter((r) => r.type === 'broken' || r.type === 'fixed' || r.type === 'not_existing')
    .map((r) => ({
      type: r.type as RecentReport['type'],
      createdAt: String(r.created_at),
      status: r.status === 'approved' ? 'approved' : 'pending',
    }));
  return {
    ...summary,
    // Garde-fou client, en plus de la contrainte SQL.
    potability: normalizePotability(summary.potability, evidence),
    address: str(json.address),
    city: str(json.city),
    countryCode: str(json.country_code) ?? 'FR',
    potabilityEvidence: evidence,
    openingHours: str(json.opening_hours),
    sources,
    photoCount: photos.length,
    updatedAt: str(json.updated_at) ?? new Date(0).toISOString(),
    operationalStatusAt: str(json.operational_status_at),
    photos,
    recentReports,
    publicationStatus: (str(json.publication_status) ??
      'published') as WaterPointDetail['publicationStatus'],
    isFree: bool(json.is_free),
    wheelchairAccessible: bool(json.wheelchair_accessible),
  };
}

function filterArgs(filters: WaterPointFilters) {
  return {
    potability_filter: filters.potability,
    hide_out_of_order: filters.hideOutOfOrder,
    sparkling_only: filters.sparklingOnly,
    free_only: filters.freeOnly,
    accessible_only: filters.accessibleOnly,
    include_decorative: filters.includeDecorative,
  };
}

export interface SupabaseWaterPointRepository extends WaterPointRepository {
  findDetail(id: string, options?: { signal?: AbortSignal }): Promise<WaterPointDetail | null>;
}

export function createSupabaseRepository(supabase: SupabaseClient): SupabaseWaterPointRepository {
  async function findDetail(id: string, options?: { signal?: AbortSignal }) {
    let request = supabase.rpc('water_point_detail', { point_id: id });
    if (options?.signal) request = request.abortSignal(options.signal);
    const { data, error } = await request;
    if (error) throw error;
    return data ? toDetail(data as DetailJson) : null;
  }

  return {
    kind: 'remote',
    async findInBounds({ bbox, filters, limit }, options) {
      const [west, south, east, north] = bbox;
      let request = supabase.rpc('water_points_in_bbox', {
        west,
        south,
        east,
        north,
        ...filterArgs(filters),
        max_points: limit,
      });
      if (options?.signal) request = request.abortSignal(options.signal);
      const { data, error } = await request;
      if (error) throw error;
      const rows = (data ?? []) as SummaryRow[];
      return { points: rows.slice(0, limit).map(toSummary), truncated: rows.length > limit };
    },
    findById: findDetail,
    findDetail,
    async findNearest(origin, { limit, maxDistanceMeters, filters }, options) {
      let request = supabase.rpc('water_points_nearby', {
        latitude: origin.latitude,
        longitude: origin.longitude,
        radius_meters: maxDistanceMeters,
        ...filterArgs(filters),
        max_points: limit,
      });
      if (options?.signal) request = request.abortSignal(options.signal);
      const { data, error } = await request;
      if (error) throw error;
      return ((data ?? []) as SummaryRow[]).map((row) => ({
        ...toSummary(row),
        distanceMeters: Number(row.distance_meters ?? 0),
      }));
    },
  };
}
