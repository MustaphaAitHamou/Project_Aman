import type {
  AvailabilityStatus,
  Freshness,
  OperationalStatus,
  PotabilityStatus,
  WaterPointKind,
} from '@water-finder/core';

import type { IconName } from '@/components/ui/Icon';
import type { StatusTone } from '@/components/ui/StatusBadge';

export interface StatusPresentation {
  tone: StatusTone;
  icon: IconName;
}

/**
 * Codes visuels des statuts. Vert : favorable ; orange : incertain ; rouge : problème ;
 * gris : inconnu. Le texte accompagne toujours la couleur.
 */
export const POTABILITY_PRESENTATION: Record<PotabilityStatus, StatusPresentation> = {
  certified_potable: { tone: 'success', icon: 'water-check' },
  declared_potable: { tone: 'warning', icon: 'water-alert' },
  not_potable: { tone: 'error', icon: 'water-off' },
  unknown: { tone: 'neutral', icon: 'help-circle-outline' },
};

export const OPERATIONAL_PRESENTATION: Record<OperationalStatus, StatusPresentation> = {
  working: { tone: 'success', icon: 'check-circle-outline' },
  out_of_order: { tone: 'error', icon: 'wrench-outline' },
  unknown: { tone: 'neutral', icon: 'help-circle-outline' },
};

export const AVAILABILITY_PRESENTATION: Record<AvailabilityStatus, StatusPresentation> = {
  available: { tone: 'success', icon: 'map-marker-check-outline' },
  seasonal_closure: { tone: 'warning', icon: 'clock-outline' },
  restricted_access: { tone: 'warning', icon: 'lock-outline' },
  removed: { tone: 'error', icon: 'map-marker-off-outline' },
  unknown: { tone: 'neutral', icon: 'help-circle-outline' },
};

export const FRESHNESS_PRESENTATION: Record<Freshness, StatusPresentation> = {
  recent: { tone: 'success', icon: 'calendar-check-outline' },
  aging: { tone: 'neutral', icon: 'clock-outline' },
  stale: { tone: 'warning', icon: 'alert-outline' },
  unknown: { tone: 'warning', icon: 'help-circle-outline' },
};

export const KIND_ICONS: Record<WaterPointKind, IconName> = {
  drinking_fountain: 'fountain',
  water_tap: 'faucet',
  bottle_refill_station: 'cup-water',
  spring: 'water-outline',
  well_pump: 'water-pump',
  decorative_fountain: 'fountain',
  other: 'water',
};
