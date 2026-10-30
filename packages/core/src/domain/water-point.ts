/**
 * Modèle de domaine d'un point d'eau.
 *
 * Trois dimensions sont volontairement séparées et ne doivent jamais être confondues :
 * - la POTABILITÉ (l'eau peut-elle être bue ?) ;
 * - l'ÉTAT DE FONCTIONNEMENT (l'eau coule-t-elle ?) ;
 * - la DISPONIBILITÉ de l'installation (est-elle accessible, ouverte, existe-t-elle encore ?).
 */

export const WATER_POINT_KINDS = [
  'drinking_fountain',
  'water_tap',
  'bottle_refill_station',
  'spring',
  'well_pump',
  'decorative_fountain',
  'other',
] as const;
export type WaterPointKind = (typeof WATER_POINT_KINDS)[number];

/**
 * - `certified_potable` : potabilité attestée par une source officielle ou une preuve sanitaire
 *   fiable, datée et propre au point (voir `potability.ts`).
 * - `declared_potable` : indiquée potable (OpenStreetMap, contributeur, panneau…) sans certification.
 * - `not_potable` : indiquée non potable.
 * - `unknown` : aucune information.
 */
export const POTABILITY_STATUSES = [
  'certified_potable',
  'declared_potable',
  'not_potable',
  'unknown',
] as const;
export type PotabilityStatus = (typeof POTABILITY_STATUSES)[number];

export const OPERATIONAL_STATUSES = ['working', 'out_of_order', 'unknown'] as const;
export type OperationalStatus = (typeof OPERATIONAL_STATUSES)[number];

export const AVAILABILITY_STATUSES = [
  'available',
  'seasonal_closure',
  'restricted_access',
  'removed',
  'unknown',
] as const;
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];

export const WATER_TYPES = ['still', 'sparkling', 'still_and_sparkling', 'unknown'] as const;
export type WaterType = (typeof WATER_TYPES)[number];

/** Catégorie de provenance d'une information. */
export const SOURCE_CATEGORIES = ['official', 'openstreetmap', 'community'] as const;
export type SourceCategory = (typeof SOURCE_CATEGORIES)[number];

export const POTABILITY_EVIDENCE_KINDS = [
  'official_dataset',
  'sanitary_control',
  'osm_tag',
  'community_report',
] as const;
export type PotabilityEvidenceKind = (typeof POTABILITY_EVIDENCE_KINDS)[number];

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** Référence vers l'origine d'une donnée (jeu de données officiel, objet OSM, contribution). */
export interface DataSourceRef {
  category: SourceCategory;
  /** Identifiant stable du connecteur, ex. `paris-fontaines`, `osm`. */
  sourceKey: string;
  /** Nom lisible, ex. « Ville de Paris — Fontaines à boire ». */
  sourceName: string;
  /** Identifiant de l'objet dans la source d'origine. */
  externalId: string | null;
  url: string | null;
  /** Licence de la source, ex. `ODbL-1.0`, `etalab-2.0`. */
  license: string | null;
  /** Date de récupération de la donnée (ISO 8601). */
  retrievedAt: string | null;
}

/** Élément justifiant le statut de potabilité. */
export interface PotabilityEvidence {
  kind: PotabilityEvidenceKind;
  sourceName: string;
  url: string | null;
  /** Date à laquelle l'information a été constatée (ex. date du contrôle sanitaire), ISO 8601. */
  observedAt: string | null;
}

/** Version allégée utilisée pour l'affichage sur la carte et dans les listes. */
export interface WaterPointSummary {
  id: string;
  name: string | null;
  kind: WaterPointKind;
  location: Coordinates;
  potability: PotabilityStatus;
  operationalStatus: OperationalStatus;
  availability: AvailabilityStatus;
  waterType: WaterType;
  isFree: boolean | null;
  wheelchairAccessible: boolean | null;
  lastVerifiedAt: string | null;
  primarySourceCategory: SourceCategory;
}

export interface WaterPoint extends WaterPointSummary {
  address: string | null;
  city: string | null;
  /** Code pays ISO 3166-1 alpha-2 (ex. `FR`). */
  countryCode: string;
  potabilityEvidence: PotabilityEvidence | null;
  /** Horaires au format OpenStreetMap `opening_hours`, si connus. */
  openingHours: string | null;
  sources: DataSourceRef[];
  photoCount: number;
  updatedAt: string;
}

export function isWaterPointKind(value: unknown): value is WaterPointKind {
  return typeof value === 'string' && (WATER_POINT_KINDS as readonly string[]).includes(value);
}

export function isPotabilityStatus(value: unknown): value is PotabilityStatus {
  return typeof value === 'string' && (POTABILITY_STATUSES as readonly string[]).includes(value);
}

export function isOperationalStatus(value: unknown): value is OperationalStatus {
  return typeof value === 'string' && (OPERATIONAL_STATUSES as readonly string[]).includes(value);
}

export function isAvailabilityStatus(value: unknown): value is AvailabilityStatus {
  return typeof value === 'string' && (AVAILABILITY_STATUSES as readonly string[]).includes(value);
}

export function isWaterType(value: unknown): value is WaterType {
  return typeof value === 'string' && (WATER_TYPES as readonly string[]).includes(value);
}

/** Un point marqué « n'existe plus » reste en base pour l'historique mais n'est jamais affiché. */
export function isDisplayable(point: Pick<WaterPointSummary, 'availability'>): boolean {
  return point.availability !== 'removed';
}

export function servesSparklingWater(point: Pick<WaterPointSummary, 'waterType'>): boolean {
  return point.waterType === 'sparkling' || point.waterType === 'still_and_sparkling';
}
