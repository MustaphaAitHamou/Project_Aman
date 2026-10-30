import { useQuery } from '@tanstack/react-query';

import { getWaterPointRepository } from './registry';

export function useWaterPoint(id: string | undefined) {
  const repository = getWaterPointRepository();
  return useQuery({
    queryKey: ['water-points', 'detail', id],
    queryFn: ({ signal }) => {
      if (!repository || !id) return null;
      return repository.findById(id, { signal });
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}
