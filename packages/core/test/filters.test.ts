import { describe, expect, it } from 'vitest';

import {
  countActiveFilters,
  DEFAULT_FILTERS,
  filtersCacheKey,
  matchesFilters,
  type WaterPointFilters,
} from '../src';
import { makePoint } from './fixtures';

const withFilters = (overrides: Partial<WaterPointFilters>): WaterPointFilters => ({
  ...DEFAULT_FILTERS,
  ...overrides,
});

describe('filtres de la carte', () => {
  it('n’affiche jamais un point signalé comme n’existant plus', () => {
    expect(matchesFilters(makePoint({ availability: 'removed' }), DEFAULT_FILTERS)).toBe(false);
  });

  it('masque les fontaines décoratives par défaut', () => {
    const decorative = makePoint({ kind: 'decorative_fountain', potability: 'unknown' });
    expect(matchesFilters(decorative, DEFAULT_FILTERS)).toBe(false);
    expect(matchesFilters(decorative, withFilters({ includeDecorative: true }))).toBe(true);
  });

  it('filtre par potabilité', () => {
    const certified = makePoint({ potability: 'certified_potable' });
    const declared = makePoint({ potability: 'declared_potable' });
    const unknown = makePoint({ potability: 'unknown' });
    const potable = withFilters({ potability: 'potable' });
    const certifiedOnly = withFilters({ potability: 'certified' });

    expect([certified, declared, unknown].map((p) => matchesFilters(p, potable))).toEqual([
      true,
      true,
      false,
    ]);
    expect([certified, declared, unknown].map((p) => matchesFilters(p, certifiedOnly))).toEqual([
      true,
      false,
      false,
    ]);
  });

  it('les autres filtres exigent une valeur explicitement vraie (inconnu = exclu)', () => {
    expect(matchesFilters(makePoint({ isFree: null }), withFilters({ freeOnly: true }))).toBe(
      false,
    );
    expect(
      matchesFilters(
        makePoint({ wheelchairAccessible: true }),
        withFilters({ accessibleOnly: true }),
      ),
    ).toBe(true);
    expect(
      matchesFilters(
        makePoint({ waterType: 'still_and_sparkling' }),
        withFilters({ sparklingOnly: true }),
      ),
    ).toBe(true);
    expect(
      matchesFilters(makePoint({ waterType: 'still' }), withFilters({ sparklingOnly: true })),
    ).toBe(false);
    expect(
      matchesFilters(
        makePoint({ operationalStatus: 'out_of_order' }),
        withFilters({ hideOutOfOrder: true }),
      ),
    ).toBe(false);
  });

  it('compte les filtres actifs et produit une clé de cache stable', () => {
    expect(countActiveFilters(DEFAULT_FILTERS)).toBe(0);
    const active = withFilters({ potability: 'potable', freeOnly: true });
    expect(countActiveFilters(active)).toBe(2);
    expect(filtersCacheKey(active)).toBe(filtersCacheKey({ ...active }));
    expect(filtersCacheKey(active)).not.toBe(filtersCacheKey(DEFAULT_FILTERS));
  });
});
