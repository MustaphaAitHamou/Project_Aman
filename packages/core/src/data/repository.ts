import type { WaterPointFilters } from '../domain/filters';
import type { Coordinates, WaterPoint, WaterPointSummary } from '../domain/water-point';
import type { BBox } from '../geo/types';

export interface BoundsQuery {
  bbox: BBox;
  filters: WaterPointFilters;
  /** Nombre maximum de points renvoyés : jamais de chargement mondial. */
  limit: number;
}

export interface BoundsResult {
  points: WaterPointSummary[];
  /** Vrai si la limite a été atteinte : l'utilisateur doit zoomer pour tout voir. */
  truncated: boolean;
}

export interface RequestOptions {
  signal?: AbortSignal;
}

/**
 * Accès aux points d'eau. Implémentations prévues : Supabase/PostGIS (phase 2).
 * L'implémentation de démonstration (phase 1) vit dans l'application mobile et n'est
 * utilisable qu'en développement.
 */
export interface WaterPointRepository {
  readonly kind: 'remote' | 'demo';
  findInBounds(query: BoundsQuery, options?: RequestOptions): Promise<BoundsResult>;
  findById(id: string, options?: RequestOptions): Promise<WaterPoint | null>;
  findNearest(
    origin: Coordinates,
    params: { limit: number; maxDistanceMeters: number; filters: WaterPointFilters },
    options?: RequestOptions,
  ): Promise<(WaterPointSummary & { distanceMeters: number })[]>;
}

/** Plafond appliqué à toute requête par emprise. */
export const MAX_POINTS_PER_QUERY = 2000;
