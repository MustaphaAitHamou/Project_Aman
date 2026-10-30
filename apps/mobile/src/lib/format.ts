import { ageInDays } from '@water-finder/core';
import type { TFunction } from 'i18next';

/** « aujourd’hui », « hier », « il y a 3 jours », « il y a 2 mois », « il y a 1 an ». */
export function formatRelativeDate(
  isoDate: string | null | undefined,
  t: TFunction,
  now: Date = new Date(),
): string | null {
  const days = ageInDays(isoDate, now);
  if (days === null) return null;
  if (days === 0) return t('time.today');
  if (days === 1) return t('time.yesterday');
  if (days < 30) return t('time.daysAgo', { count: days });
  if (days < 365) return t('time.monthsAgo', { count: Math.floor(days / 30) });
  return t('time.yearsAgo', { count: Math.floor(days / 365) });
}
