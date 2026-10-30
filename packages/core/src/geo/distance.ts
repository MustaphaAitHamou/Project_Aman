import type { Coordinates } from '../domain/water-point';

/** Rayon terrestre moyen (IUGG), en mètres. */
export const EARTH_RADIUS_METERS = 6_371_008.8;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/** Distance orthodromique (formule de haversine), en mètres. */
export function haversineDistanceMeters(a: Coordinates, b: Coordinates): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Trie des éléments par distance croissante à une origine, sans muter le tableau d'entrée. */
export function sortByDistance<T extends { location: Coordinates }>(
  items: readonly T[],
  origin: Coordinates,
): (T & { distanceMeters: number })[] {
  return items
    .map((item) => ({ ...item, distanceMeters: haversineDistanceMeters(origin, item.location) }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}
