import { DEFAULT_FILTERS } from '@water-finder/core';

import {
  createSupabaseRepository,
  toDetail,
  toSummary,
  type SummaryRow,
} from '../supabase-repository';
import contract from './fixtures/sql-contract.json';

/**
 * Contrat base ↔ application : les fixtures sont les réponses réelles des fonctions SQL
 * (water_points_in_bbox, water_points_nearby, water_point_detail) capturées sur PostGIS local.
 */
describe('contrat SQL → application', () => {
  it('convertit une ligne de water_points_in_bbox', () => {
    const summary = toSummary(contract.bbox[0] as SummaryRow);
    expect(summary).toMatchObject({
      id: '20000000-0000-0000-0000-000000000001',
      kind: 'drinking_fountain',
      potability: 'certified_potable',
      operationalStatus: 'working',
      waterType: 'still_and_sparkling',
      isFree: true,
      wheelchairAccessible: null,
      primarySourceCategory: 'official',
    });
    expect(summary.location.latitude).toBeCloseTo(48.8566, 6);
    expect(summary.location.longitude).toBeCloseTo(2.3522, 6);
  });

  it('convertit la fiche détaillée avec preuve, sources, photos et signalements', () => {
    const detail = toDetail(contract.detail as Parameters<typeof toDetail>[0]);
    expect(detail.potability).toBe('certified_potable');
    expect(detail.potabilityEvidence).toEqual({
      kind: 'official_dataset',
      sourceName: 'Source officielle de test',
      url: 'https://example.invalid/controle',
      observedAt: '2026-06-01',
    });
    expect(detail.sources[0]).toMatchObject({
      sourceKey: 'test-officiel',
      license: 'etalab-2.0',
      externalId: 'F-42',
    });
    expect(detail.photos).toHaveLength(1);
    expect(detail.recentReports).toEqual([
      expect.objectContaining({ type: 'fixed', status: 'approved' }),
    ]);
    expect(detail.openingHours).toBe('Mo-Su 08:00-20:00');
  });

  it('une valeur inconnue devient « inconnu », jamais une valeur favorable', () => {
    const odd = toSummary({
      ...(contract.bbox[0] as SummaryRow),
      potability: 'super_potable',
      kind: 'jacuzzi',
    });
    expect(odd.potability).toBe('unknown');
    expect(odd.kind).toBe('other');
  });

  it('rétrograde une certification sans preuve datée', () => {
    const detail = toDetail({ ...contract.detail, potability_evidence: null } as Parameters<
      typeof toDetail
    >[0]);
    expect(detail.potability).toBe('declared_potable');
  });
});

describe('dépôt Supabase', () => {
  function fakeClient(response: { data: unknown; error: unknown }) {
    const calls: { fn: string; args: Record<string, unknown> }[] = [];
    const client = {
      rpc: (fn: string, args: Record<string, unknown>) => {
        calls.push({ fn, args });
        const result = Promise.resolve(response);
        return Object.assign(result, { abortSignal: () => result });
      },
    };
    return { client, calls };
  }

  it('appelle water_points_in_bbox avec les filtres et détecte la troncature', async () => {
    const rows = [contract.bbox[0], { ...contract.bbox[0], id: 'autre' }];
    const { client, calls } = fakeClient({ data: rows, error: null });
    const repo = createSupabaseRepository(client as never);
    const result = await repo.findInBounds({
      bbox: [2.3, 48.8, 2.4, 48.9],
      filters: { ...DEFAULT_FILTERS, potability: 'certified', freeOnly: true },
      limit: 1,
    });
    expect(calls[0]).toEqual({
      fn: 'water_points_in_bbox',
      args: {
        west: 2.3,
        south: 48.8,
        east: 2.4,
        north: 48.9,
        potability_filter: 'certified',
        hide_out_of_order: false,
        sparkling_only: false,
        free_only: true,
        accessible_only: false,
        include_decorative: false,
        max_points: 1,
      },
    });
    expect(result.points).toHaveLength(1);
    expect(result.truncated).toBe(true);
  });

  it('remonte les erreurs du backend', async () => {
    const { client } = fakeClient({ data: null, error: new Error('boom') });
    const repo = createSupabaseRepository(client as never);
    await expect(
      repo.findInBounds({ bbox: [0, 0, 1, 1], filters: DEFAULT_FILTERS, limit: 10 }),
    ).rejects.toThrow('boom');
  });

  it('distances des plus proches voisins', async () => {
    const { client } = fakeClient({ data: contract.nearby, error: null });
    const repo = createSupabaseRepository(client as never);
    const nearest = await repo.findNearest(
      { latitude: 48.857, longitude: 2.353 },
      { limit: 5, maxDistanceMeters: 1000, filters: DEFAULT_FILTERS },
    );
    expect(nearest[0]?.distanceMeters).toBeGreaterThan(50);
    expect(nearest[0]?.distanceMeters).toBeLessThan(100);
  });
});
