import { useQuery } from '@tanstack/react-query';
import type { Coordinates } from '@water-finder/core';
import { useTranslation } from 'react-i18next';

import { providerFor, reverseGeocode } from './geocoding';

/**
 * Adresse affichée pour un point d'eau :
 * - `known` : fournie par la source du point (jeu de données officiel, contribution) ;
 * - `approximate` : adresse la plus proche trouvée par géocodage inverse ;
 * - `loading` / `unavailable` : recherche en cours, ou rien de fiable à afficher.
 */
export type PointAddressState =
  | { status: 'known'; text: string }
  | { status: 'approximate'; text: string }
  | { status: 'loading' }
  | { status: 'unavailable' };

/** Adresse de la source, sans répéter la ville si elle figure déjà dans l'adresse. */
export function storedAddress(point: {
  address?: string | null;
  city?: string | null;
}): string | null {
  const address = point.address?.trim() || null;
  const city = point.city?.trim() || null;
  if (address && city && address.toLowerCase().includes(city.toLowerCase())) return address;
  return [address, city].filter(Boolean).join(', ') || null;
}

/**
 * Adresse d'un point : celle de sa source, sinon la plus proche (Géoplateforme en France, Photon
 * ailleurs). Seules les coordonnées du point d'eau sont envoyées, jamais celles de l'utilisateur.
 * `waitForStored` : attendre la fiche (qui peut contenir l'adresse) avant tout géocodage.
 */
export function usePointAddress(
  point: { location: Coordinates; address?: string | null; city?: string | null } | null,
  options: { waitForStored?: boolean } = {},
): PointAddressState {
  const { i18n } = useTranslation();
  const known = point ? storedAddress(point) : null;
  const latitude = point?.location.latitude ?? 0;
  const longitude = point?.location.longitude ?? 0;
  const provider = providerFor([longitude, latitude], null);
  const query = useQuery({
    queryKey: [
      'reverse-geocode',
      provider,
      latitude.toFixed(5),
      longitude.toFixed(5),
      i18n.language,
    ],
    queryFn: ({ signal }) =>
      reverseGeocode([longitude, latitude], { provider, signal, language: i18n.language }),
    enabled: !!point && !known && !options.waitForStored,
    // Une adresse ne change pas pendant la session : aucune nouvelle requête pour ce point.
    staleTime: Infinity,
    retry: 1,
  });

  if (!point) return { status: 'unavailable' };
  if (known) return { status: 'known', text: known };
  if (options.waitForStored || query.isPending) return { status: 'loading' };
  if (query.data) return { status: 'approximate', text: query.data.label };
  return { status: 'unavailable' };
}
