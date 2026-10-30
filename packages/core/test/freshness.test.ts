import { describe, expect, it } from 'vitest';

import { ageInDays, getFreshness } from '../src';

const now = new Date('2026-10-29T12:00:00Z');

describe('ancienneté des informations', () => {
  it('renvoie « unknown » sans date ou avec une date invalide', () => {
    expect(getFreshness(null, now)).toBe('unknown');
    expect(getFreshness(undefined, now)).toBe('unknown');
    expect(getFreshness('invalide', now)).toBe('unknown');
  });

  it('classe selon les seuils de 90 et 365 jours', () => {
    expect(getFreshness('2026-10-28T12:00:00Z', now)).toBe('recent');
    expect(getFreshness('2026-08-01T12:00:00Z', now)).toBe('recent');
    expect(getFreshness('2026-03-01T12:00:00Z', now)).toBe('aging');
    expect(getFreshness('2025-01-01T12:00:00Z', now)).toBe('stale');
  });

  it('calcule l’âge en jours entiers et ne renvoie jamais de valeur négative', () => {
    expect(ageInDays('2026-10-19T12:00:00Z', now)).toBe(10);
    expect(ageInDays('2027-01-01T00:00:00Z', now)).toBe(0);
  });
});
