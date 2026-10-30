import {
  bboxContainsPoint,
  haversineDistanceMeters,
  matchesFilters,
  type WaterPoint,
  type WaterPointRepository,
  type WaterPointSummary,
} from '@water-finder/core';

import { createDemoWaterPoints } from './demo-fixtures';

function toSummary(point: WaterPoint): WaterPointSummary {
  return {
    id: point.id,
    name: point.name,
    kind: point.kind,
    location: point.location,
    potability: point.potability,
    operationalStatus: point.operationalStatus,
    availability: point.availability,
    waterType: point.waterType,
    isFree: point.isFree,
    wheelchairAccessible: point.wheelchairAccessible,
    lastVerifiedAt: point.lastVerifiedAt,
    primarySourceCategory: point.primarySourceCategory,
  };
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      const error = new Error('Aborted');
      error.name = 'AbortError';
      reject(error);
    });
  });
}

/** Dépôt en mémoire sur données fictives (développement uniquement). */
export function createDemoRepository(options: { latencyMs?: number } = {}): WaterPointRepository {
  const latencyMs = options.latencyMs ?? 250;
  const points = createDemoWaterPoints();

  return {
    kind: 'demo',
    async findInBounds({ bbox, filters, limit }, requestOptions) {
      await delay(latencyMs, requestOptions?.signal);
      const matching = points.filter(
        (point) => bboxContainsPoint(bbox, point.location) && matchesFilters(point, filters),
      );
      return {
        points: matching.slice(0, limit).map(toSummary),
        truncated: matching.length > limit,
      };
    },
    async findById(id, requestOptions) {
      await delay(latencyMs, requestOptions?.signal);
      return points.find((point) => point.id === id) ?? null;
    },
    async findNearest(origin, { limit, maxDistanceMeters, filters }, requestOptions) {
      await delay(latencyMs, requestOptions?.signal);
      return points
        .filter((point) => matchesFilters(point, filters))
        .map((point) => ({
          ...toSummary(point),
          distanceMeters: haversineDistanceMeters(origin, point.location),
        }))
        .filter((point) => point.distanceMeters <= maxDistanceMeters)
        .sort((a, b) => a.distanceMeters - b.distanceMeters)
        .slice(0, limit);
    },
  };
}
