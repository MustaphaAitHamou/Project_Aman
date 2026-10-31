import { describe, expect, it } from 'vitest';

import { describeChanges, formatDate, formatValue, label, osmLink, REPORT_LABELS } from './labels';

describe('libellés d’administration', () => {
  it('décrit une proposition de modification', () => {
    expect(
      describeChanges(
        { name: 'Fontaine B', is_free: false, kind: 'water_tap' },
        { name: 'Fontaine A', is_free: true, kind: 'drinking_fountain' },
      ),
    ).toEqual([
      { field: 'name', before: 'Fontaine A', after: 'Fontaine B' },
      { field: 'is_free', before: 'Oui', after: 'Non' },
      { field: 'kind', before: 'Fontaine à boire', after: 'Robinet' },
    ]);
  });

  it('valeurs absentes et inconnues', () => {
    expect(formatValue(null)).toBe('—');
    expect(label(REPORT_LABELS, 'nouveau_type')).toBe('nouveau_type');
    expect(label(REPORT_LABELS, undefined)).toBe('—');
    expect(formatDate('pas une date')).toBe('—');
    expect(formatDate('2026-10-31T12:00:00Z')).toMatch(/31\/10\/2026/);
  });

  it('lien de vérification OpenStreetMap', () => {
    expect(osmLink(48.85, 2.35)).toBe(
      'https://www.openstreetmap.org/?mlat=48.85&mlon=2.35#map=19/48.85/2.35',
    );
  });
});
