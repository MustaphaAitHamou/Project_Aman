import type { DistanceUnit } from './types';

const NBSP = ' ';
const METERS_PER_FOOT = 0.3048;
const METERS_PER_MILE = 1609.344;

export interface FormatDistanceOptions {
  /** Locale BCP 47, ex. `fr`, `en`, `fr-FR`. */
  locale: string;
  unit?: DistanceUnit;
}

function formatNumber(value: number, locale: string, maximumFractionDigits: number): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value);
}

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/**
 * Formate une distance pour l'affichage : « 45 m », « 120 m », « 1,2 km », « 12 km »
 * (ou pieds / miles en système impérial). Une espace insécable sépare la valeur de l'unité.
 */
export function formatDistance(
  meters: number,
  { locale, unit = 'metric' }: FormatDistanceOptions,
): string {
  if (!Number.isFinite(meters) || meters < 0) return '—';

  if (unit === 'imperial') {
    const feet = meters / METERS_PER_FOOT;
    if (feet < 528) {
      const rounded = Math.max(10, roundTo(feet, 10));
      return `${formatNumber(rounded, locale, 0)}${NBSP}ft`;
    }
    const miles = meters / METERS_PER_MILE;
    return `${formatNumber(miles, locale, miles < 10 ? 1 : 0)}${NBSP}mi`;
  }

  if (meters < 1000) {
    const rounded = meters < 50 ? Math.max(5, roundTo(meters, 5)) : roundTo(meters, 10);
    if (rounded < 1000) return `${formatNumber(rounded, locale, 0)}${NBSP}m`;
  }
  const km = meters / 1000;
  return `${formatNumber(km, locale, km < 10 ? 1 : 0)}${NBSP}km`;
}
