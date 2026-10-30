import Papa from 'papaparse';

import {
  cleanText,
  normalizeKey,
  parseBoolean,
  parseDate,
  parseNumber,
  toCoordinates,
} from './normalize';
import type { ImportPayload, ImportRecord, Rejection, TransformResult } from './types';

/**
 * Correspondance générique des colonnes d'un jeu de données public vers le modèle Water Finder.
 * Seuls les champs effectivement présents sont utilisés : rien n'est déduit ni inventé.
 * Les synonymes sont comparés après normalisation (minuscules, sans accents ni séparateurs).
 */
const FIELD_SYNONYMS = {
  id: [
    'id',
    'identifiant',
    'gid',
    'objectid',
    'code',
    'id fontaine',
    'identifiant fontaine',
    'recordid',
  ],
  latitude: ['latitude', 'lat', 'y wgs84', 'coord lat', 'lat wgs84'],
  longitude: ['longitude', 'lon', 'lng', 'long', 'x wgs84', 'coord lon', 'lon wgs84'],
  point: ['geo point 2d', 'geo point', 'coordonnees', 'geopoint', 'position'],
  name: ['nom', 'name', 'libelle', 'designation', 'nom fontaine', 'intitule'],
  address: ['adresse', 'address', 'adresse postale', 'localisation'],
  street: ['voie', 'rue', 'nom voie'],
  number: ['numero', 'no voirie', 'no voirie pair', 'no voirie impair', 'num voie'],
  city: ['commune', 'ville', 'city', 'nom commune'],
  potable: ['potable', 'eau potable', 'potabilite', 'eau destinee a la consommation'],
  operational: [
    'en service',
    'dispo',
    'disponible',
    'fonctionnement',
    'etat',
    'statut',
    'en fonctionnement',
  ],
  free: ['gratuit', 'gratuite', 'acces gratuit'],
  accessible: ['pmr', 'accessible pmr', 'accessibilite pmr', 'acces pmr', 'accessible'],
  sparkling: ['petillante', 'eau petillante', 'gazeuse', 'eau gazeuse'],
  type: ['type', 'type objet', 'type fontaine', 'modele', 'categorie'],
  updated: [
    'date maj',
    'date mise a jour',
    'derniere mise a jour',
    'date controle',
    'date verification',
    'mise a jour',
  ],
  hours: ['horaires', 'opening hours', 'horaire'],
} as const;

export type MappedField = keyof typeof FIELD_SYNONYMS;
export type ColumnMap = Partial<Record<MappedField, string>>;

/** Associe chaque champ du modèle à la première colonne correspondante du jeu de données. */
export function detectColumns(columns: readonly string[]): ColumnMap {
  const normalized = columns.map((column) => ({ column, key: normalizeKey(column) }));
  const map: ColumnMap = {};
  for (const [field, synonyms] of Object.entries(FIELD_SYNONYMS) as [
    MappedField,
    readonly string[],
  ][]) {
    const match = normalized.find(({ key }) => synonyms.includes(key));
    if (match) map[field] = match.column;
  }
  return map;
}

function operationalFrom(value: unknown): ImportPayload['operational_status'] {
  const bool = parseBoolean(value);
  if (bool !== null) return bool ? 'working' : 'out_of_order';
  const key = typeof value === 'string' ? normalizeKey(value) : '';
  if (['en service', 'fonctionne', 'disponible', 'ok', 'en fonctionnement'].includes(key))
    return 'working';
  if (['hors service', 'hs', 'en panne', 'indisponible', 'ferme', 'arret'].includes(key))
    return 'out_of_order';
  return 'unknown';
}

function pointFrom(value: unknown): { latitude: unknown; longitude: unknown } | null {
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>;
    if ('lat' in v && 'lon' in v) return { latitude: v.lat, longitude: v.lon };
    if (Array.isArray(v.coordinates))
      return { latitude: v.coordinates[1], longitude: v.coordinates[0] };
  }
  if (typeof value === 'string') {
    const parts = value.split(/[,;\s]+/).filter(Boolean);
    if (parts.length === 2) return { latitude: parts[0], longitude: parts[1] };
  }
  return null;
}

export interface TabularOptions {
  /** Nom de la source affiché comme preuve de potabilité. */
  sourceName: string;
  sourceUrl: string;
  license: string;
  /** Date de mise à jour du jeu (à défaut d'une date par point). */
  datasetModifiedAt: string | null;
  /** Le jeu ne recense que des fontaines à boire (ex. « fontaines à boire » d'une ville). */
  datasetIsDrinkingFountains: boolean;
  idPrefix?: string;
}

/**
 * Transforme des lignes (objets) d'un jeu de données en enregistrements d'import.
 *
 * Potabilité : un jeu officiel de fontaines à boire donne « indiquée potable » avec une preuve
 * de type `official_dataset`. La certification n'est PAS accordée automatiquement : elle reste
 * une décision explicite (voir DATA_SOURCES.md) tant que la nature exacte de la preuve
 * (contrôle sanitaire daté par point) n'a pas été vérifiée.
 */
export function transformRows(
  rows: readonly Record<string, unknown>[],
  options: TabularOptions,
): TransformResult {
  const columns = rows.length ? Object.keys(rows[0] as object) : [];
  const map = detectColumns(columns);
  const notes = [
    `Colonnes reconnues : ${
      Object.entries(map)
        .map(([f, c]) => `${f}←${c}`)
        .join(', ') || 'aucune'
    }`,
  ];
  const hasCoordinates = (map.latitude && map.longitude) || map.point;
  if (!hasCoordinates) {
    return {
      records: [],
      rejections: [],
      notes: [...notes, 'Aucune colonne de coordonnées reconnue : jeu ignoré.'],
    };
  }

  const records: ImportRecord[] = [];
  const rejections: Rejection[] = [];
  rows.forEach((row, index) => {
    const get = (field: MappedField) => (map[field] ? row[map[field] as string] : undefined);
    const rawId = cleanText(get('id'), 120) ?? `ligne-${index + 1}`;
    const externalId = `${options.idPrefix ?? ''}${rawId}`;
    const pointSource = map.point
      ? pointFrom(get('point'))
      : { latitude: get('latitude'), longitude: get('longitude') };
    const coords = pointSource ? toCoordinates(pointSource.latitude, pointSource.longitude) : null;
    if (!coords) {
      rejections.push({ externalId, reason: 'coordonnées absentes, invalides ou non WGS84' });
      return;
    }

    const potableField = parseBoolean(get('potable'));
    const isPotable = potableField ?? (options.datasetIsDrinkingFountains ? true : null);
    const typeText = normalizeKey(String(get('type') ?? ''));
    const sparkling =
      parseBoolean(get('sparkling')) ?? (typeText.includes('petillant') ? true : null);
    const observedAt = parseDate(get('updated')) ?? options.datasetModifiedAt;
    const street = [cleanText(get('number'), 20), cleanText(get('street'), 200)]
      .filter(Boolean)
      .join(' ');

    records.push({
      externalId,
      payload: {
        kind: options.datasetIsDrinkingFountains || isPotable ? 'drinking_fountain' : 'water_tap',
        latitude: coords.latitude,
        longitude: coords.longitude,
        name: cleanText(get('name'), 120),
        address: cleanText(get('address'), 240) ?? (street || null),
        city: cleanText(get('city'), 120),
        potability: isPotable === null ? 'unknown' : isPotable ? 'declared_potable' : 'not_potable',
        potability_evidence:
          isPotable === null
            ? null
            : {
                kind: 'official_dataset',
                source_name: options.sourceName,
                url: options.sourceUrl,
                observed_at: observedAt ? observedAt.slice(0, 10) : null,
              },
        operational_status: map.operational ? operationalFrom(get('operational')) : 'unknown',
        availability: 'available',
        water_type: sparkling === true ? 'still_and_sparkling' : 'unknown',
        is_free: parseBoolean(get('free')),
        wheelchair_accessible: parseBoolean(get('accessible')),
        opening_hours: cleanText(get('hours'), 255),
        last_verified_at: parseDate(get('updated')),
        url: options.sourceUrl,
        license: options.license,
      },
    });
  });
  return { records, rejections, notes };
}

/** Lignes d'un fichier selon son format (CSV avec détection du séparateur, JSON, GeoJSON). */
export function parseTabular(content: string, format: string): Record<string, unknown>[] {
  const kind = format.toLowerCase();
  if (
    kind.includes('geojson') ||
    (kind.includes('json') && content.includes('"FeatureCollection"'))
  ) {
    const geo = JSON.parse(content) as {
      features?: { properties?: Record<string, unknown>; geometry?: unknown }[];
    };
    return (geo.features ?? []).map((feature) => ({
      ...(feature.properties ?? {}),
      geo_point: feature.geometry ?? null,
    }));
  }
  if (kind.includes('json')) {
    const data = JSON.parse(content) as unknown;
    if (Array.isArray(data)) return data as Record<string, unknown>[];
    const results = (data as { results?: unknown }).results;
    return Array.isArray(results) ? (results as Record<string, unknown>[]) : [];
  }
  const parsed = Papa.parse<Record<string, unknown>>(content.replace(/^﻿/, ''), {
    header: true,
    skipEmptyLines: true,
    delimiter: '',
  });
  return parsed.data;
}

// Ré-export pour les connecteurs.
export { parseNumber };
