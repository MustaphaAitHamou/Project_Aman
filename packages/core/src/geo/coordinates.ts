import type { Coordinates } from '../domain/water-point';
import type { LngLat } from './types';

/** Latitude maximale de la projection Web Mercator utilisée par les tuiles. */
export const MAX_MERCATOR_LATITUDE = 85.051129;

export function isValidLatitude(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= -90 && value <= 90;
}

export function isValidLongitude(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= -180 && value <= 180;
}

export function isValidCoordinates(
  value: Partial<Coordinates> | null | undefined,
): value is Coordinates {
  return !!value && isValidLatitude(value.latitude) && isValidLongitude(value.longitude);
}

/** Rejette aussi le point (0, 0), valeur par défaut fréquente des données erronées. */
export function isPlausibleCoordinates(
  value: Partial<Coordinates> | null | undefined,
): value is Coordinates {
  return isValidCoordinates(value) && !(value.latitude === 0 && value.longitude === 0);
}

export function toLngLat(coordinates: Coordinates): LngLat {
  return [coordinates.longitude, coordinates.latitude];
}

export function fromLngLat([longitude, latitude]: LngLat): Coordinates {
  return { latitude, longitude };
}

/** 6 décimales ≈ 11 cm : précision suffisante, évite le bruit des flottants. */
export function roundCoordinate(value: number, decimals = 6): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
