import type { WaterPointSummary } from '../src';

/** Fabrique de points pour les tests unitaires uniquement (aucune donnée réelle). */
export function makePoint(overrides: Partial<WaterPointSummary> = {}): WaterPointSummary {
  return {
    id: 'test-point',
    name: 'Point de test',
    kind: 'drinking_fountain',
    location: { latitude: 48.8566, longitude: 2.3522 },
    potability: 'declared_potable',
    operationalStatus: 'working',
    availability: 'available',
    waterType: 'still',
    isFree: true,
    wheelchairAccessible: null,
    lastVerifiedAt: null,
    primarySourceCategory: 'openstreetmap',
    ...overrides,
  };
}
