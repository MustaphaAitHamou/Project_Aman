/** Ancienneté d'une information, pour signaler clairement les données anciennes. */
export type Freshness = 'recent' | 'aging' | 'stale' | 'unknown';

export const FRESHNESS_THRESHOLDS_DAYS = {
  /** En deçà : information récente. */
  recent: 90,
  /** Au-delà : information ancienne, à revérifier. */
  stale: 365,
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;

export function ageInDays(
  isoDate: string | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!isoDate) return null;
  const time = Date.parse(isoDate);
  if (Number.isNaN(time)) return null;
  return Math.max(0, Math.floor((now.getTime() - time) / DAY_MS));
}

export function getFreshness(
  isoDate: string | null | undefined,
  now: Date = new Date(),
): Freshness {
  const days = ageInDays(isoDate, now);
  if (days === null) return 'unknown';
  if (days <= FRESHNESS_THRESHOLDS_DAYS.recent) return 'recent';
  if (days <= FRESHNESS_THRESHOLDS_DAYS.stale) return 'aging';
  return 'stale';
}
