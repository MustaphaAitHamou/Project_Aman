/** Coordonnées au format GeoJSON / MapLibre : [longitude, latitude]. */
export type LngLat = [longitude: number, latitude: number];

/** Emprise géographique au format GeoJSON : [ouest, sud, est, nord]. */
export type BBox = [west: number, south: number, east: number, north: number];

export type DistanceUnit = 'metric' | 'imperial';
