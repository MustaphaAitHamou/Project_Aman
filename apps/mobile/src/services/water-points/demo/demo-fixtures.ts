import type {
  AvailabilityStatus,
  OperationalStatus,
  PotabilityStatus,
  WaterPoint,
  WaterPointKind,
  WaterType,
} from '@water-finder/core';

/**
 * ⚠️ DONNÉES FICTIVES — DÉVELOPPEMENT UNIQUEMENT.
 * Ces points n'existent pas. Ils servent à tester l'interface (marqueurs, groupes, panneau)
 * avant la connexion des vraies sources (phases 2-3). Activation explicite via
 * EXPO_PUBLIC_DEMO_DATA=true, impossible en production, avec un bandeau permanent à l'écran.
 */

const ANCHOR = { latitude: 48.8566, longitude: 2.3522 };

// Décalages fixes (en degrés) : rendu déterministe, avec une zone dense pour tester les groupes.
// prettier-ignore
const OFFSETS: readonly [number, number][] = [
  [0.0006, 0.0004], [0.0011, -0.0009], [-0.0008, 0.0012], [-0.0014, -0.0005], [0.0003, -0.0018],
  [0.0021, 0.0016], [-0.0025, 0.0021], [0.0031, -0.0026], [-0.0034, -0.0031], [0.0042, 0.0007],
  [-0.0047, 0.0011], [0.0052, -0.0043], [-0.0058, 0.0049], [0.0063, 0.0055], [-0.0071, -0.0062],
  [0.0084, -0.0012], [-0.0093, 0.0035], [0.0105, 0.0072], [-0.0118, -0.0081], [0.0127, -0.0094],
  [0.0002, 0.0001], [0.0003, 0.0002], [0.0001, 0.0003], [-0.0002, 0.0002], [0.0142, 0.0118],
  [-0.0156, 0.0127], [0.0169, -0.0141], [-0.0181, -0.0152], [0.0195, 0.0163], [-0.0208, 0.0004],
];

const KINDS: readonly WaterPointKind[] = [
  'drinking_fountain',
  'drinking_fountain',
  'water_tap',
  'bottle_refill_station',
  'drinking_fountain',
  'spring',
];
const POTABILITY: readonly PotabilityStatus[] = [
  'certified_potable',
  'declared_potable',
  'declared_potable',
  'unknown',
  'not_potable',
];
const OPERATIONAL: readonly OperationalStatus[] = [
  'working',
  'working',
  'working',
  'out_of_order',
  'unknown',
];
const AVAILABILITY: readonly AvailabilityStatus[] = [
  'available',
  'available',
  'available',
  'seasonal_closure',
  'restricted_access',
  'unknown',
];
const WATER_TYPES: readonly WaterType[] = ['still', 'still', 'still_and_sparkling', 'unknown'];
const VERIFIED_DAYS_AGO: readonly (number | null)[] = [3, 40, 200, 500, null];

const pick = <T>(values: readonly T[], index: number): T => values[index % values.length] as T;

export function createDemoWaterPoints(now: Date = new Date()): WaterPoint[] {
  return OFFSETS.map(([dLat, dLon], index) => {
    const daysAgo = pick(VERIFIED_DAYS_AGO, index);
    const verifiedAt =
      daysAgo === null
        ? null
        : new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    const potability = pick(POTABILITY, index);
    return {
      id: `demo-${index + 1}`,
      name: `Point de démonstration n°${index + 1}`,
      kind: pick(KINDS, index),
      location: { latitude: ANCHOR.latitude + dLat, longitude: ANCHOR.longitude + dLon },
      potability,
      potabilityEvidence:
        potability === 'certified_potable'
          ? {
              kind: 'official_dataset',
              sourceName: 'Données de démonstration (fictives)',
              url: null,
              observedAt: verifiedAt,
            }
          : null,
      operationalStatus: pick(OPERATIONAL, index),
      availability: pick(AVAILABILITY, index),
      waterType: pick(WATER_TYPES, index),
      isFree: index % 7 === 6 ? null : true,
      wheelchairAccessible: index % 3 === 0 ? true : index % 3 === 1 ? null : false,
      lastVerifiedAt: verifiedAt,
      // Cohérence : une potabilité certifiée ne peut provenir que d'une source officielle.
      primarySourceCategory:
        potability === 'certified_potable'
          ? 'official'
          : index % 2 === 0
            ? 'openstreetmap'
            : 'community',
      address: null,
      city: 'Démonstration',
      countryCode: 'FR',
      openingHours: null,
      sources: [
        {
          category: potability === 'certified_potable' ? 'official' : 'community',
          sourceKey: 'demo',
          sourceName: 'Données de démonstration (fictives)',
          externalId: null,
          url: null,
          license: null,
          retrievedAt: now.toISOString(),
        },
      ],
      photoCount: 0,
      updatedAt: now.toISOString(),
    };
  });
}
