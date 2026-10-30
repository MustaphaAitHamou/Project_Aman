import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  bboxCacheKey,
  expandBBox,
  filtersCacheKey,
  MAX_POINTS_PER_QUERY,
  quantizeBBox,
  type BBox,
  type WaterPointFilters,
  type WaterPointSummary,
} from '@water-finder/core';

import { getWaterPointRepository } from './registry';

/** En dessous de ce zoom, aucun point n'est chargé (jamais de chargement global). */
export const MIN_DATA_ZOOM = 11;

export interface Viewport {
  bounds: BBox;
  zoom: number;
}

export type ViewportData =
  | { status: 'no_source' }
  | { status: 'zoom_in' }
  | { status: 'loading' }
  | { status: 'error'; retry: () => void }
  | { status: 'ready'; points: WaterPointSummary[]; truncated: boolean; isFetching: boolean };

/**
 * Emprise réellement demandée au serveur : la zone visible agrandie de 25 % puis alignée
 * sur une grille, pour que les petits déplacements réutilisent le cache.
 */
export function toQueryBBox(viewport: Viewport): BBox {
  return quantizeBBox(expandBBox(viewport.bounds, 0.25), viewport.zoom);
}

export function useWaterPointsInViewport(
  viewport: Viewport | null,
  filters: WaterPointFilters,
): ViewportData {
  const repository = getWaterPointRepository();
  const zoomOk = !!viewport && viewport.zoom >= MIN_DATA_ZOOM;
  const bbox = viewport && zoomOk ? toQueryBBox(viewport) : null;

  const query = useQuery({
    queryKey: ['water-points', 'bbox', bbox ? bboxCacheKey(bbox) : null, filtersCacheKey(filters)],
    queryFn: ({ signal }) => {
      if (!repository || !bbox) throw new Error('Requête désactivée');
      return repository.findInBounds({ bbox, filters, limit: MAX_POINTS_PER_QUERY }, { signal });
    },
    enabled: !!repository && !!bbox,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });

  if (!repository) return { status: 'no_source' };
  if (!zoomOk) return { status: 'zoom_in' };
  if (query.isError && !query.data) return { status: 'error', retry: () => void query.refetch() };
  if (!query.data) return { status: 'loading' };
  return {
    status: 'ready',
    points: query.data.points,
    truncated: query.data.truncated,
    isFetching: query.isFetching,
  };
}
