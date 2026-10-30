import { isPlausibleCoordinates } from '@water-finder/core';

/** Minuscules, sans accents, séparateurs uniformisés : « Eau_Pétillante » → « eau petillante ». */
export function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function cleanText(value: unknown, max = 240): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, max) : null;
}

/** « oui », « yes », « true », « 1 », « o » → true ; « non », « no », « false », « 0 », « n » → false. */
export function parseBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1 ? true : value === 0 ? false : null;
  const key = typeof value === 'string' ? normalizeKey(value) : '';
  if (['oui', 'yes', 'true', '1', 'o', 'y', 'vrai'].includes(key)) return true;
  if (['non', 'no', 'false', '0', 'n', 'faux'].includes(key)) return false;
  return null;
}

export function parseNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || !value.trim()) return null;
  const number = Number(value.trim().replace(',', '.'));
  return Number.isFinite(number) ? number : null;
}

/** Date ISO 8601 (AAAA-MM-JJ ou complète), ou JJ/MM/AAAA. */
export function parseDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const text = value.trim();
  const fr = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  const iso = fr ? `${fr[3]}-${fr[2]}-${fr[1]}` : text;
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return null;
  return new Date(time).toISOString();
}

/**
 * Coordonnées WGS84 plausibles. Refuse explicitement les projections métriques (ex. Lambert 93),
 * reconnaissables à des valeurs hors des bornes de latitude/longitude.
 */
export function toCoordinates(
  latitude: unknown,
  longitude: unknown,
): { latitude: number; longitude: number } | null {
  const lat = parseNumber(latitude);
  const lon = parseNumber(longitude);
  if (lat === null || lon === null) return null;
  const candidate = { latitude: lat, longitude: lon };
  return isPlausibleCoordinates(candidate) ? candidate : null;
}
