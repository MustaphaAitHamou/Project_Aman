import type { Coordinates } from '../domain/water-point';

export type DirectionsProvider = 'apple' | 'google';
export type TravelMode = 'walking' | 'driving' | 'transit' | 'bicycling';

const APPLE_DIRECTION_FLAGS: Record<TravelMode, string> = {
  walking: 'w',
  driving: 'd',
  transit: 'r',
  // Apple Plans ne propose pas de paramètre vélo dans ce format d'URL : repli sur la marche.
  bicycling: 'w',
};

function formatLatLng({ latitude, longitude }: Coordinates): string {
  return `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
}

/**
 * URL universelle d'itinéraire vers un point (Apple Plans ou Google Maps).
 * Le moteur de navigation reste celui de l'application cartographique de l'utilisateur.
 */
export function buildDirectionsUrl(
  destination: Coordinates,
  provider: DirectionsProvider,
  travelMode: TravelMode = 'walking',
): string {
  const target = formatLatLng(destination);
  if (provider === 'apple') {
    const params = new URLSearchParams({
      daddr: target,
      dirflg: APPLE_DIRECTION_FLAGS[travelMode],
    });
    return `https://maps.apple.com/?${params.toString()}`;
  }
  const params = new URLSearchParams({ api: '1', destination: target, travelmode: travelMode });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
