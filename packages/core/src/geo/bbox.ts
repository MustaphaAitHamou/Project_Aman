import type { Coordinates } from '../domain/water-point';
import { MAX_MERCATOR_LATITUDE, roundCoordinate } from './coordinates';
import { EARTH_RADIUS_METERS } from './distance';
import type { BBox, LngLat } from './types';

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export function isValidBBox(bbox: readonly number[]): bbox is BBox {
  if (bbox.length !== 4 || !bbox.every(Number.isFinite)) return false;
  const [west, south, east, north] = bbox as BBox;
  return south <= north && south >= -90 && north <= 90 && west >= -180 && east <= 180;
}

/**
 * Borne l'emprise aux limites de la projection. Une emprise qui traverse l'antiméridien
 * (ouest > est) est élargie à toutes les longitudes : cas marginal, jamais rencontré en France.
 */
export function normalizeBBox([west, south, east, north]: BBox): BBox {
  const s = clamp(Math.min(south, north), -MAX_MERCATOR_LATITUDE, MAX_MERCATOR_LATITUDE);
  const n = clamp(Math.max(south, north), -MAX_MERCATOR_LATITUDE, MAX_MERCATOR_LATITUDE);
  if (west > east) return [-180, s, 180, n];
  return [clamp(west, -180, 180), s, clamp(east, -180, 180), n];
}

/** Agrandit l'emprise d'un ratio de sa taille de chaque côté (0.25 = +25 % par côté). */
export function expandBBox([west, south, east, north]: BBox, ratio: number): BBox {
  const dx = (east - west) * ratio;
  const dy = (north - south) * ratio;
  return normalizeBBox([west - dx, south - dy, east + dx, north + dy]);
}

/**
 * Aligne l'emprise vers l'extérieur sur une grille dépendant du zoom (une demi-tuile).
 * De petits déplacements de carte produisent ainsi la même emprise, donc la même clé de cache.
 */
export function quantizeBBox(bbox: BBox, zoom: number): BBox {
  const z = clamp(Math.floor(zoom), 0, 22);
  const step = 360 / 2 ** z / 2;
  const [west, south, east, north] = normalizeBBox(bbox);
  return normalizeBBox([
    roundCoordinate(Math.floor(west / step) * step),
    roundCoordinate(Math.floor(south / step) * step),
    roundCoordinate(Math.ceil(east / step) * step),
    roundCoordinate(Math.ceil(north / step) * step),
  ]);
}

export function bboxContains(outer: BBox, inner: BBox): boolean {
  return (
    inner[0] >= outer[0] && inner[1] >= outer[1] && inner[2] <= outer[2] && inner[3] <= outer[3]
  );
}

export function bboxContainsPoint([west, south, east, north]: BBox, point: Coordinates): boolean {
  return (
    point.longitude >= west &&
    point.longitude <= east &&
    point.latitude >= south &&
    point.latitude <= north
  );
}

export function bboxCenter([west, south, east, north]: BBox): LngLat {
  return [(west + east) / 2, (south + north) / 2];
}

/** Emprise approximative d'un cercle de rayon donné (en mètres) autour d'un point. */
export function bboxAround(center: Coordinates, radiusMeters: number): BBox {
  const latDelta = (radiusMeters / EARTH_RADIUS_METERS) * (180 / Math.PI);
  const cosLat = Math.max(0.01, Math.cos((center.latitude * Math.PI) / 180));
  const lonDelta = latDelta / cosLat;
  return normalizeBBox([
    center.longitude - lonDelta,
    center.latitude - latDelta,
    center.longitude + lonDelta,
    center.latitude + latDelta,
  ]);
}

export function bboxCacheKey(bbox: BBox): string {
  return bbox.map((value) => roundCoordinate(value).toFixed(6)).join(',');
}
