import type { LngLat } from '@water-finder/core';

import { env } from '@/config/env';

/**
 * Recherche d'adresses via le service de géocodage de la Géoplateforme (IGN, Base Adresse
 * Nationale), sans clé d'API. Réponse GeoJSON (même format que l'ancienne API Adresse) :
 * `features[].properties.label` et `geometry.coordinates = [longitude, latitude]`.
 * Seul le texte saisi est envoyé : jamais la position de l'utilisateur.
 */

export interface GeocodingResult {
  id: string;
  label: string;
  context: string | null;
  type: 'housenumber' | 'street' | 'locality' | 'municipality' | 'other';
  center: LngLat;
}

export const MIN_GEOCODING_QUERY = 3;

const TYPES = ['housenumber', 'street', 'locality', 'municipality'] as const;

/** Conversion défensive de la réponse : les entrées incomplètes sont ignorées. */
export function parseGeocodingResponse(json: unknown): GeocodingResult[] {
  const features = (json as { features?: unknown })?.features;
  if (!Array.isArray(features)) return [];
  const results: GeocodingResult[] = [];
  for (const feature of features as Record<string, unknown>[]) {
    const props = (feature.properties ?? {}) as Record<string, unknown>;
    const coords = (feature.geometry as { coordinates?: unknown } | undefined)?.coordinates;
    if (!Array.isArray(coords)) continue;
    const [lng, lat] = coords.map(Number);
    const label = typeof props.label === 'string' ? props.label : null;
    if (!label || !Number.isFinite(lng) || !Number.isFinite(lat)) continue;
    if (Math.abs(lat as number) > 90 || Math.abs(lng as number) > 180) continue;
    const type = TYPES.find((t) => t === props.type) ?? 'other';
    results.push({
      id: typeof props.id === 'string' ? props.id : `${label}-${lng}-${lat}`,
      label,
      context: typeof props.context === 'string' ? props.context : null,
      type,
      center: [lng as number, lat as number],
    });
  }
  return results;
}

/** Zoom de la carte adapté au type de résultat. */
export function zoomForResult(result: GeocodingResult): number {
  switch (result.type) {
    case 'housenumber':
      return 17;
    case 'street':
      return 16;
    case 'locality':
      return 15;
    default:
      return 13;
  }
}

export async function searchAddresses(
  query: string,
  options: { signal?: AbortSignal; limit?: number; fetchImpl?: typeof fetch } = {},
): Promise<GeocodingResult[]> {
  const q = query.trim();
  if (q.length < MIN_GEOCODING_QUERY) return [];
  const params = new URLSearchParams({
    q,
    limit: String(options.limit ?? 8),
    index: 'address',
  });
  const response = await (options.fetchImpl ?? fetch)(`${env.geocodingUrl}?${params}`, {
    signal: options.signal,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`geocoding_http_${response.status}`);
  return parseGeocodingResponse(await response.json());
}
