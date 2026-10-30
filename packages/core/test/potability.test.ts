import { describe, expect, it } from 'vitest';

import {
  isCertifyingEvidence,
  isIndicatedPotable,
  normalizePotability,
  potabilityFromCommunityClaim,
  type PotabilityEvidence,
} from '../src';

const officialEvidence: PotabilityEvidence = {
  kind: 'official_dataset',
  sourceName: 'Ville de Paris',
  url: 'https://opendata.paris.fr/',
  observedAt: '2026-06-01',
};

describe('certification de la potabilité', () => {
  it('accepte une preuve officielle datée', () => {
    expect(isCertifyingEvidence(officialEvidence)).toBe(true);
    expect(normalizePotability('certified_potable', officialEvidence)).toBe('certified_potable');
  });

  it('refuse une certification sans preuve et la rétrograde en « déclarée »', () => {
    expect(normalizePotability('certified_potable', null)).toBe('declared_potable');
  });

  it('refuse une preuve officielle non datée', () => {
    const undated = { ...officialEvidence, observedAt: null };
    expect(isCertifyingEvidence(undated)).toBe(false);
    expect(normalizePotability('certified_potable', undated)).toBe('declared_potable');
  });

  it('refuse une date invalide', () => {
    expect(isCertifyingEvidence({ ...officialEvidence, observedAt: 'pas une date' })).toBe(false);
  });

  it('ne certifie jamais à partir d’un avis utilisateur ou d’un tag OSM', () => {
    for (const kind of ['community_report', 'osm_tag'] as const) {
      const evidence = { ...officialEvidence, kind };
      expect(isCertifyingEvidence(evidence)).toBe(false);
      expect(normalizePotability('certified_potable', evidence)).toBe('declared_potable');
    }
  });

  it('une contribution communautaire ne produit jamais un statut certifié', () => {
    expect(potabilityFromCommunityClaim('potable')).toBe('declared_potable');
    expect(potabilityFromCommunityClaim('not_potable')).toBe('not_potable');
  });

  it('laisse inchangés les statuts non certifiés', () => {
    expect(normalizePotability('not_potable', null)).toBe('not_potable');
    expect(normalizePotability('unknown', null)).toBe('unknown');
    expect(normalizePotability('declared_potable', null)).toBe('declared_potable');
  });

  it('distingue « indiquée potable » des autres statuts', () => {
    expect(isIndicatedPotable('certified_potable')).toBe(true);
    expect(isIndicatedPotable('declared_potable')).toBe(true);
    expect(isIndicatedPotable('not_potable')).toBe(false);
    expect(isIndicatedPotable('unknown')).toBe(false);
  });
});
