import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { MIN_GEOCODING_QUERY, searchAddresses } from './geocoding';

/** Valeur retardée : évite une requête par frappe. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function useAddressSearch(query: string) {
  const debounced = useDebouncedValue(query.trim(), 350);
  return useQuery({
    queryKey: ['geocoding', debounced],
    queryFn: ({ signal }) => searchAddresses(debounced, { signal }),
    enabled: debounced.length >= MIN_GEOCODING_QUERY,
    staleTime: 10 * 60_000,
    placeholderData: keepPreviousData,
    retry: 1,
  });
}
