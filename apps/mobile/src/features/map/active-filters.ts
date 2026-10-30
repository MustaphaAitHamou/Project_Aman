import { DEFAULT_FILTERS, type WaterPointFilters } from '@water-finder/core';

export type ActiveFilterKey =
  'potable' | 'certified' | 'hideOutOfOrder' | 'sparkling' | 'free' | 'accessible' | 'decorative';

export interface ActiveFilter {
  key: ActiveFilterKey;
  /** Modification qui désactive ce filtre. */
  reset: Partial<WaterPointFilters>;
}

/** Liste ordonnée des filtres actifs, affichés en puces sous la barre de recherche. */
export function getActiveFilters(filters: WaterPointFilters): ActiveFilter[] {
  const active: ActiveFilter[] = [];
  if (filters.potability === 'potable')
    active.push({ key: 'potable', reset: { potability: 'any' } });
  if (filters.potability === 'certified')
    active.push({ key: 'certified', reset: { potability: 'any' } });
  if (filters.hideOutOfOrder)
    active.push({ key: 'hideOutOfOrder', reset: { hideOutOfOrder: false } });
  if (filters.sparklingOnly) active.push({ key: 'sparkling', reset: { sparklingOnly: false } });
  if (filters.freeOnly) active.push({ key: 'free', reset: { freeOnly: false } });
  if (filters.accessibleOnly) active.push({ key: 'accessible', reset: { accessibleOnly: false } });
  if (filters.includeDecorative !== DEFAULT_FILTERS.includeDecorative) {
    active.push({
      key: 'decorative',
      reset: { includeDecorative: DEFAULT_FILTERS.includeDecorative },
    });
  }
  return active;
}
