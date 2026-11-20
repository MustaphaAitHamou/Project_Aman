import { haversineDistanceMeters, type LngLat } from '@water-finder/core';

import { env } from '@/config/env';

/**
 * Recherche d'adresses, sans clé d'API, par deux services selon la zone affichée :
 * - France : Géoplateforme (IGN, Base Adresse Nationale), réponse GeoJSON avec
 *   `properties.label` ;
 * - autres pays : Photon (komoot, données OpenStreetMap), réponse GeoJSON dont le libellé est
 *   reconstitué à partir des champs d'adresse.
 * Seul le texte saisi est envoyé : jamais la position de l'utilisateur.
 */

export type GeocodingProvider = 'ign' | 'photon';

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

const PHOTON_TYPES: Record<string, GeocodingResult['type']> = {
  house: 'housenumber',
  street: 'street',
  locality: 'locality',
  district: 'locality',
  city: 'municipality',
  town: 'municipality',
  village: 'municipality',
};

/** Conversion d'une réponse Photon (GeoJSON, propriétés d'adresse OpenStreetMap). */
export function parsePhotonResponse(json: unknown): GeocodingResult[] {
  const features = (json as { features?: unknown })?.features;
  if (!Array.isArray(features)) return [];
  const results: GeocodingResult[] = [];
  for (const feature of features as Record<string, unknown>[]) {
    const p = (feature.properties ?? {}) as Record<string, unknown>;
    const text = (key: string) => (typeof p[key] === 'string' ? (p[key] as string) : null);
    const coords = (feature.geometry as { coordinates?: unknown } | undefined)?.coordinates;
    if (!Array.isArray(coords)) continue;
    const [lng, lat] = coords.map(Number);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
    if (Math.abs(lat as number) > 90 || Math.abs(lng as number) > 180) continue;
    const street = [text('housenumber'), text('street')].filter(Boolean).join(' ');
    const label = text('name') ?? (street || null);
    if (!label) continue;
    const place = [text('postcode'), text('city')].filter(Boolean).join(' ');
    const context = [
      street && street !== label ? street : null,
      place || null,
      text('state'),
      text('country'),
    ]
      .filter((part, index, all) => part && all.indexOf(part) === index && part !== label)
      .join(', ');
    results.push({
      id: `${text('osm_type') ?? 'x'}${String(p.osm_id ?? `${lng},${lat}`)}`,
      label,
      context: context || null,
      type: PHOTON_TYPES[text('type') ?? ''] ?? 'other',
      center: [lng as number, lat as number],
    });
  }
  return results;
}

/** France métropolitaine et Corse : zone couverte par la Géoplateforme. */
const FRANCE_BBOX = [-5.3, 41.3, 9.6, 51.2] as const;

/** Service adapté à la zone affichée (sinon au pays de l'appareil). */
export function providerFor(center: LngLat | null, region: string | null): GeocodingProvider {
  if (center) {
    const [lng, lat] = center;
    const inFrance =
      lng >= FRANCE_BBOX[0] &&
      lng <= FRANCE_BBOX[2] &&
      lat >= FRANCE_BBOX[1] &&
      lat <= FRANCE_BBOX[3];
    return inFrance ? 'ign' : 'photon';
  }
  return region === null || region === 'FR' ? 'ign' : 'photon';
}

export async function searchAddresses(
  query: string,
  options: {
    signal?: AbortSignal;
    limit?: number;
    fetchImpl?: typeof fetch;
    provider?: GeocodingProvider;
    language?: string;
  } = {},
): Promise<GeocodingResult[]> {
  const q = query.trim();
  if (q.length < MIN_GEOCODING_QUERY) return [];
  const limit = String(options.limit ?? 8);
  const photon = options.provider === 'photon';
  const params = photon
    ? new URLSearchParams({
        q,
        limit,
        // Langues prises en charge par Photon : default, en, fr, de.
        lang: options.language === 'fr' ? 'fr' : 'en',
      })
    : new URLSearchParams({ q, limit, index: 'address' });
  const base = photon ? env.geocodingIntlUrl : env.geocodingUrl;
  const response = await (options.fetchImpl ?? fetch)(`${base}?${params}`, {
    signal: options.signal,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`geocoding_http_${response.status}`);
  const json: unknown = await response.json();
  return photon ? parsePhotonResponse(json) : parseGeocodingResponse(json);
}

/** Adresse la plus proche d'un point (géocodage inverse). */
export interface ReverseGeocodingResult {
  label: string;
  /** Distance en mètres entre le point et l'adresse trouvée, si le service la fournit. */
  distanceM: number | null;
}

/** Au-delà, l'adresse trouvée est trop éloignée pour situer le point : elle n'est pas affichée. */
export const MAX_REVERSE_DISTANCE_M = 250;

/** Réponse de la Géoplateforme (`/geocodage/reverse`) : `properties.label`, `properties.distance`. */
export function parseIgnReverseResponse(json: unknown): ReverseGeocodingResult | null {
  const features = (json as { features?: unknown })?.features;
  if (!Array.isArray(features)) return null;
  for (const feature of features as Record<string, unknown>[]) {
    const props = (feature?.properties ?? {}) as Record<string, unknown>;
    const label = typeof props.label === 'string' ? props.label.trim() : '';
    if (!label) continue;
    const distance = typeof props.distance === 'number' ? props.distance : Number.NaN;
    return { label, distanceM: Number.isFinite(distance) ? distance : null };
  }
  return null;
}

/** Réponse de Photon (`/reverse`) : libellé reconstitué, distance calculée depuis le point. */
export function parsePhotonReverseResponse(
  json: unknown,
  origin: LngLat,
): ReverseGeocodingResult | null {
  const features = (json as { features?: unknown })?.features;
  if (!Array.isArray(features)) return null;
  for (const feature of features as Record<string, unknown>[]) {
    const p = (feature?.properties ?? {}) as Record<string, unknown>;
    const text = (key: string) =>
      typeof p[key] === 'string' && (p[key] as string).trim() ? (p[key] as string).trim() : null;
    const street = [text('housenumber'), text('street')].filter(Boolean).join(' ');
    const place = [text('postcode'), text('city') ?? text('town') ?? text('village')]
      .filter(Boolean)
      .join(' ');
    const first = street || text('name');
    const label = [first, place].filter(Boolean).join(', ');
    if (!label) continue;
    const coords = (feature.geometry as { coordinates?: unknown } | undefined)?.coordinates;
    let distanceM: number | null = null;
    if (Array.isArray(coords)) {
      const [lng, lat] = coords.map(Number);
      if (Number.isFinite(lng) && Number.isFinite(lat)) {
        distanceM = haversineDistanceMeters(
          { latitude: origin[1], longitude: origin[0] },
          { latitude: lat as number, longitude: lng as number },
        );
      }
    }
    return { label, distanceM };
  }
  return null;
}

/**
 * Adresse la plus proche des coordonnées d'un point d'eau. Seules ces coordonnées (publiques)
 * sont envoyées, jamais la position de l'utilisateur. `null` si rien d'assez proche.
 */
export async function reverseGeocode(
  center: LngLat,
  options: {
    provider: GeocodingProvider;
    signal?: AbortSignal;
    fetchImpl?: typeof fetch;
    language?: string;
  },
): Promise<ReverseGeocodingResult | null> {
  const [lng, lat] = center;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  const photon = options.provider === 'photon';
  const coords = { lon: lng.toFixed(5), lat: lat.toFixed(5), limit: '1' };
  const params = photon
    ? new URLSearchParams({ ...coords, lang: options.language === 'fr' ? 'fr' : 'en' })
    : new URLSearchParams({ ...coords, index: 'address' });
  const base = photon ? env.reverseGeocodingIntlUrl : env.reverseGeocodingUrl;
  const response = await (options.fetchImpl ?? fetch)(`${base}?${params}`, {
    signal: options.signal,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`reverse_geocoding_http_${response.status}`);
  const json: unknown = await response.json();
  const result = photon ? parsePhotonReverseResponse(json, center) : parseIgnReverseResponse(json);
  if (!result) return null;
  if (result.distanceM !== null && result.distanceM > MAX_REVERSE_DISTANCE_M) return null;
  return result;
}
