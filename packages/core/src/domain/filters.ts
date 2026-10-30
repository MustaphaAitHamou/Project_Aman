import { isIndicatedPotable } from './potability';
import { isDisplayable, servesSparklingWater, type WaterPointSummary } from './water-point';

export type PotabilityFilter = 'any' | 'potable' | 'certified';

/**
 * Filtres de la carte. La même sémantique devra être reproduite côté serveur (PostGIS, phase 2).
 */
export interface WaterPointFilters {
  potability: PotabilityFilter;
  hideOutOfOrder: boolean;
  sparklingOnly: boolean;
  freeOnly: boolean;
  accessibleOnly: boolean;
  includeDecorative: boolean;
}

export const DEFAULT_FILTERS: Readonly<WaterPointFilters> = Object.freeze({
  potability: 'any',
  hideOutOfOrder: false,
  sparklingOnly: false,
  freeOnly: false,
  accessibleOnly: false,
  includeDecorative: false,
});

export function matchesFilters(point: WaterPointSummary, filters: WaterPointFilters): boolean {
  if (!isDisplayable(point)) return false;
  if (!filters.includeDecorative && point.kind === 'decorative_fountain') return false;
  if (filters.potability === 'potable' && !isIndicatedPotable(point.potability)) return false;
  if (filters.potability === 'certified' && point.potability !== 'certified_potable') return false;
  if (filters.hideOutOfOrder && point.operationalStatus === 'out_of_order') return false;
  if (filters.sparklingOnly && !servesSparklingWater(point)) return false;
  if (filters.freeOnly && point.isFree !== true) return false;
  if (filters.accessibleOnly && point.wheelchairAccessible !== true) return false;
  return true;
}

/** Nombre de filtres différents des valeurs par défaut (pour le badge du bouton Filtres). */
export function countActiveFilters(filters: WaterPointFilters): number {
  return (Object.keys(DEFAULT_FILTERS) as (keyof WaterPointFilters)[]).filter(
    (key) => filters[key] !== DEFAULT_FILTERS[key],
  ).length;
}

/** Clé stable et ordonnée, utilisable dans une clé de cache. */
export function filtersCacheKey(filters: WaterPointFilters): string {
  return [
    filters.potability,
    filters.hideOutOfOrder ? 1 : 0,
    filters.sparklingOnly ? 1 : 0,
    filters.freeOnly ? 1 : 0,
    filters.accessibleOnly ? 1 : 0,
    filters.includeDecorative ? 1 : 0,
  ].join('|');
}
