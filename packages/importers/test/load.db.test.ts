import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { OSM_SOURCE, transformOsmResponse, type OsmElement } from '../src/connectors/osm';
import { loadRecords } from '../src/load';

/**
 * Chargement réel dans une base PostgreSQL + PostGIS migrée (supabase/local/reset-db.sh).
 * Exécuté seulement si TEST_DATABASE_URL est défini.
 */
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('chargement en base (PostGIS)', () => {
  const client = new pg.Client({ connectionString: url });
  const elements: OsmElement[] = [
    { type: 'node', id: 101, lat: 48.8701, lon: 2.3301, tags: { amenity: 'drinking_water' } },
    {
      type: 'node',
      id: 102,
      lat: 48.8801,
      lon: 2.3401,
      tags: { man_made: 'water_tap', drinking_water: 'no' },
    },
    {
      type: 'node',
      id: 103,
      lat: 48.87011,
      lon: 2.33012,
      tags: { amenity: 'fountain', drinking_water: 'yes' },
    },
    { type: 'node', id: 104, tags: { amenity: 'drinking_water' } },
  ];

  beforeAll(async () => {
    await client.connect();
    await client.query('set search_path = public, extensions');
    await client.query('begin');
  });
  afterAll(async () => {
    await client.query('rollback');
    await client.end();
  });

  it('premier import, puis réimport idempotent', async () => {
    const { records, rejections } = transformOsmResponse(elements);
    // Pas de transaction imbriquée : le chargeur gère ses lots, on désactive son begin/commit.
    const first = await loadRecords(asNested(client), OSM_SOURCE, records, rejections);
    // Deux objets OSM distincts restent distincts (doublons internes : outil de modération).
    expect(first).toMatchObject({
      inserted: 3,
      merged: 0,
      unchanged: 0,
      rejected: 1,
      status: 'partial',
    });

    const second = await loadRecords(asNested(client), OSM_SOURCE, records, rejections);
    expect(second).toMatchObject({ inserted: 0, merged: 0, updated: 0, unchanged: 3 });

    const { rows } = await client.query(
      "select count(*)::int as n from water_points where primary_source_category = 'openstreetmap'",
    );
    expect(rows[0].n).toBe(3);
  });

  it('une source officielle rattache ses points aux points OSM proches (pas de doublon visible)', async () => {
    const official = {
      ...OSM_SOURCE,
      key: 'test-officiel',
      name: 'Officiel test',
      category: 'official' as const,
    };
    const stats = await loadRecords(
      asNested(client),
      official,
      [
        {
          externalId: 'F-1',
          payload: {
            kind: 'drinking_fountain',
            latitude: 48.87012,
            longitude: 2.33011,
            potability: 'certified_potable',
            potability_evidence: {
              kind: 'official_dataset',
              source_name: 'Officiel test',
              observed_at: '2026-06-01',
            },
            operational_status: 'working',
          },
        },
      ],
      [],
    );
    expect(stats).toMatchObject({ merged: 1, inserted: 0 });
    const { rows } = await client.query(
      'select potability, primary_source_category, (select count(*)::int from water_point_sources s where s.water_point_id = w.id) as sources from water_points w where st_dwithin(location, st_setsrid(st_makepoint(2.33011, 48.87012), 4326)::geography, 3) order by sources desc limit 1',
    );
    expect(rows[0]).toMatchObject({
      potability: 'certified_potable',
      primary_source_category: 'official',
      sources: 2,
    });
  });

  it('une modification dans la source met le point à jour sans doublon', async () => {
    const changed = transformOsmResponse([
      { ...elements[0]!, tags: { amenity: 'drinking_water', name: 'Nouveau nom' } },
    ]);
    const stats = await loadRecords(asNested(client), OSM_SOURCE, changed.records, []);
    expect(stats).toMatchObject({ updated: 1, inserted: 0 });
  });
});

/** Neutralise begin/commit/rollback pour exécuter le chargeur dans la transaction du test. */
function asNested(client: pg.Client): pg.Client {
  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop === 'query') {
        return (text: unknown, values?: unknown[]) =>
          typeof text === 'string' && ['begin', 'commit', 'rollback'].includes(text)
            ? Promise.resolve({ rows: [] })
            : target.query(text as string, values);
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}
