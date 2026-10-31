import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { deviceRegion } from '@/lib/region';
import { useMapCameraStore } from '@/stores/map-camera';

import { MIN_GEOCODING_QUERY, providerFor, searchAddresses } from './geocoding';

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
  const { i18n } = useTranslation();
  const debounced = useDebouncedValue(query.trim(), 350);
  const center = useMapCameraStore((state) => state.lastView?.center ?? null);
  const provider = providerFor(center, deviceRegion());
  const language = i18n.language;
  const result = useQuery({
    queryKey: ['geocoding', provider, language, debounced],
    queryFn: ({ signal }) => searchAddresses(debounced, { signal, provider, language }),
    enabled: debounced.length >= MIN_GEOCODING_QUERY,
    staleTime: 10 * 60_000,
    placeholderData: keepPreviousData,
    retry: 1,
  });
  return { ...result, provider };
}
