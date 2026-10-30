import { useQuery } from '@tanstack/react-query';
import type { WaterPoint } from '@water-finder/core';

import { getWaterPointRepository } from './registry';
import type { WaterPointDetail } from './supabase-repository';

/** Complète un point simple (ex. mode démo) pour l'afficher comme une fiche. */
export function asDetail(point: WaterPoint | WaterPointDetail): WaterPointDetail {
  return {
    operationalStatusAt: null,
    photos: [],
    recentReports: [],
    publicationStatus: 'published',
    ...point,
  };
}

export function useWaterPoint(id: string | undefined) {
  const repository = getWaterPointRepository();
  return useQuery({
    queryKey: ['water-points', 'detail', id],
    queryFn: async ({ signal }) => {
      if (!repository || !id) return null;
      const point = await repository.findById(id, { signal });
      return point ? asDetail(point) : null;
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}
