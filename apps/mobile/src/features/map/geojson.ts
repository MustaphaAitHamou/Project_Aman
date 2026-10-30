import type { OperationalStatus, PotabilityStatus, WaterPointSummary } from '@water-finder/core';

import type { UserPosition } from '@/services/location/types';

/** Propriétés minimales embarquées dans chaque point de la carte (performances). */
export interface PointFeatureProperties {
  id: string;
  potability: PotabilityStatus;
  operational: OperationalStatus;
}

export type PointFeatureCollection = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  PointFeatureProperties
>;

export const EMPTY_POINTS: PointFeatureCollection = { type: 'FeatureCollection', features: [] };

export function toPointFeatureCollection(
  points: readonly WaterPointSummary[],
): PointFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: points.map((point) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [point.location.longitude, point.location.latitude] },
      properties: {
        id: point.id,
        potability: point.potability,
        operational: point.operationalStatus,
      },
    })),
  };
}

export interface UserFeatureProperties {
  accuracy: number;
}

export type UserFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Point, UserFeatureProperties>;

export const EMPTY_USER: UserFeatureCollection = { type: 'FeatureCollection', features: [] };

export function toUserFeatureCollection(position: UserPosition | null): UserFeatureCollection {
  if (!position) return EMPTY_USER;
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [position.longitude, position.latitude] },
        properties: { accuracy: Math.min(position.accuracy ?? 0, 2000) },
      },
    ],
  };
}

/** Extrait l'identifiant d'un point ou d'un groupe à partir d'une entité touchée sur la carte. */
export type PressedFeature =
  | { type: 'cluster'; clusterId: number; coordinates: [number, number] }
  | { type: 'point'; id: string }
  | null;

export function parsePressedFeature(feature: GeoJSON.Feature | undefined): PressedFeature {
  if (!feature?.properties) return null;
  const properties = feature.properties as Record<string, unknown>;
  if (properties.cluster === true || properties.cluster_id !== undefined) {
    const clusterId = Number(properties.cluster_id);
    const geometry = feature.geometry;
    if (!Number.isFinite(clusterId) || geometry.type !== 'Point') return null;
    const [lng, lat] = geometry.coordinates;
    if (lng === undefined || lat === undefined) return null;
    return { type: 'cluster', clusterId, coordinates: [lng, lat] };
  }
  return typeof properties.id === 'string' ? { type: 'point', id: properties.id } : null;
}
