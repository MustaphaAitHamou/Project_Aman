import i18n from '@/i18n';

import { formatRelativeDate } from '../format';

const now = new Date('2026-10-29T12:00:00Z');
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();

describe('formatRelativeDate (fr)', () => {
  const t = i18n.getFixedT('fr');

  it.each([
    [0, 'aujourd’hui'],
    [1, 'hier'],
    [3, 'il y a 3 jours'],
    [45, 'il y a 1 mois'],
    [200, 'il y a 6 mois'],
    [400, 'il y a 1 an'],
    [800, 'il y a 2 ans'],
  ])('%i jour(s) → « %s »', (days, expected) => {
    expect(formatRelativeDate(daysAgo(days), t, now)).toBe(expected);
  });

  it('renvoie null pour une date absente ou invalide', () => {
    expect(formatRelativeDate(null, t, now)).toBeNull();
    expect(formatRelativeDate('n’importe quoi', t, now)).toBeNull();
  });
});

describe('formatRelativeDate (en)', () => {
  it('accorde le pluriel anglais', () => {
    const t = i18n.getFixedT('en');
    expect(formatRelativeDate(daysAgo(1), t, now)).toBe('yesterday');
    expect(formatRelativeDate(daysAgo(2), t, now)).toBe('2 days ago');
    expect(formatRelativeDate(daysAgo(400), t, now)).toBe('1 year ago');
  });
});
