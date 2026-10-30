import { describe, expect, it } from 'vitest';

import { createDatagouvConnector } from '../src/connectors/datagouv';
import { createOpendatasoftConnector, OPENDATASOFT_SOURCES } from '../src/connectors/opendatasoft';
import {
  buildOverpassQuery,
  transformOsmElement,
  transformOsmResponse,
  type OsmElement,
} from '../src/connectors/osm';
import { createHttpClient, HttpError } from '../src/http';
import { parseBoolean, parseDate, toCoordinates } from '../src/normalize';
import { detectColumns, parseTabular, transformRows } from '../src/tabular';
import type { HttpClient, ImportRecord } from '../src/types';

// Éléments OSM construits pour les tests (respectent les conventions de tags du wiki OSM).
const osm = (tags: Record<string, string>, extra: Partial<OsmElement> = {}): OsmElement => ({
  type: 'node',
  id: 1,
  lat: 48.85,
  lon: 2.35,
  tags,
  ...extra,
});
const payloadOf = (result: ReturnType<typeof transformOsmElement>) => {
  if (!('payload' in result)) throw new Error(result.reason);
  return result.payload;
};

describe('OpenStreetMap', () => {
  it('amenity=drinking_water → fontaine indiquée potable (jamais certifiée)', () => {
    const p = payloadOf(
      transformOsmElement(osm({ amenity: 'drinking_water', name: 'Wallace', fee: 'no' })),
    );
    expect(p).toMatchObject({
      kind: 'drinking_fountain',
      potability: 'declared_potable',
      potability_evidence: { kind: 'osm_tag' },
      operational_status: 'unknown',
      is_free: true,
      name: 'Wallace',
      url: 'https://www.openstreetmap.org/node/1',
      license: 'ODbL-1.0',
    });
  });

  it('une fontaine sans drinking_water=yes est décorative et de potabilité inconnue', () => {
    expect(payloadOf(transformOsmElement(osm({ amenity: 'fountain' })))).toMatchObject({
      kind: 'decorative_fountain',
      potability: 'unknown',
    });
    expect(
      payloadOf(transformOsmElement(osm({ amenity: 'fountain', drinking_water: 'yes' }))),
    ).toMatchObject({
      kind: 'drinking_fountain',
      potability: 'declared_potable',
    });
  });

  it('une source naturelle n’est jamais potable par défaut', () => {
    expect(payloadOf(transformOsmElement(osm({ natural: 'spring' }))).potability).toBe('unknown');
    expect(
      payloadOf(transformOsmElement(osm({ natural: 'spring', drinking_water: 'no' }))).potability,
    ).toBe('not_potable');
  });

  it('robinets, accès restreint, hors service, dates de vérification', () => {
    const p = payloadOf(
      transformOsmElement(
        osm({
          man_made: 'water_tap',
          access: 'customers',
          disused: 'yes',
          check_date: '2026-05-01',
          wheelchair: 'yes',
        }),
      ),
    );
    expect(p).toMatchObject({
      kind: 'water_tap',
      potability: 'unknown',
      availability: 'restricted_access',
      operational_status: 'out_of_order',
      wheelchair_accessible: true,
      last_verified_at: '2026-05-01T00:00:00.000Z',
    });
  });

  it('utilise le centre des chemins et rejette les éléments sans coordonnées', () => {
    const way = transformOsmElement(
      osm(
        { amenity: 'drinking_water' },
        { type: 'way', id: 9, lat: undefined, lon: undefined, center: { lat: 45.76, lon: 4.83 } },
      ),
    );
    expect(way).toMatchObject({
      externalId: 'way/9',
      payload: { latitude: 45.76, longitude: 4.83 },
    });
    const result = transformOsmResponse([
      osm({ amenity: 'drinking_water' }, { lat: undefined, lon: undefined }),
    ]);
    expect(result.rejections).toHaveLength(1);
  });

  it('requête Overpass par pays ou par emprise', () => {
    expect(buildOverpassQuery()).toContain('area["ISO3166-1"="FR"]');
    const query = buildOverpassQuery([2.2, 48.8, 2.5, 48.9]);
    expect(query).toContain('(48.8,2.2,48.9,2.5)');
    expect(query).toContain('nwr["amenity"="drinking_water"]');
  });
});

describe('normalisation', () => {
  it('booléens, dates et coordonnées', () => {
    expect([parseBoolean('Oui'), parseBoolean('NON'), parseBoolean('peut-être')]).toEqual([
      true,
      false,
      null,
    ]);
    expect(parseDate('01/06/2026')).toBe('2026-06-01T00:00:00.000Z');
    expect(toCoordinates('48,85', '2.35')).toEqual({ latitude: 48.85, longitude: 2.35 });
    expect(toCoordinates(6_861_000, 652_000)).toBeNull(); // Lambert 93 : refusé
    expect(toCoordinates(0, 0)).toBeNull();
  });
});

describe('jeux de données tabulaires', () => {
  it('reconnaît les colonnes par synonymes, sans accents ni casse', () => {
    expect(
      detectColumns([
        'Identifiant',
        'Latitude',
        'LONGITUDE',
        'Commune',
        'Eau pétillante',
        'Accessible PMR',
      ]),
    ).toEqual({
      id: 'Identifiant',
      latitude: 'Latitude',
      longitude: 'LONGITUDE',
      city: 'Commune',
      sparkling: 'Eau pétillante',
      accessible: 'Accessible PMR',
    });
  });

  it('transforme un CSV (séparateur « ; ») sans inventer de champ', () => {
    const csv =
      'identifiant;latitude;longitude;commune;en_service;gratuit\nF1;48,85;2,35;Paris;oui;oui\nF2;;;Paris;non;oui\n';
    const rows = parseTabular(csv, 'csv');
    const result = transformRows(rows, {
      sourceName: 'Collectivité test',
      sourceUrl: 'https://example.invalid',
      license: 'etalab-2.0',
      datasetModifiedAt: '2026-09-01T00:00:00Z',
      datasetIsDrinkingFountains: true,
      idPrefix: 'test:',
    });
    expect(result.rejections).toEqual([
      { externalId: 'test:F2', reason: expect.stringContaining('coordonnées') },
    ]);
    expect(result.records[0]).toMatchObject({
      externalId: 'test:F1',
      payload: {
        kind: 'drinking_fountain',
        potability: 'declared_potable',
        potability_evidence: { kind: 'official_dataset', observed_at: '2026-09-01' },
        operational_status: 'working',
        is_free: true,
        wheelchair_accessible: null,
        water_type: 'unknown',
      },
    });
  });

  it('un jeu sans colonne de coordonnées est ignoré avec une explication', () => {
    const result = transformRows([{ nom: 'A' }], {
      sourceName: 's',
      sourceUrl: 'u',
      license: 'l',
      datasetModifiedAt: null,
      datasetIsDrinkingFountains: true,
    });
    expect(result.records).toEqual([]);
    expect(result.notes.join()).toContain('Aucune colonne de coordonnées');
  });

  it('GeoJSON : la géométrie fournit les coordonnées', () => {
    const geojson = JSON.stringify({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { id: 'G1', petillante: 'oui' },
          geometry: { type: 'Point', coordinates: [4.83, 45.76] },
        },
      ],
    });
    const result = transformRows(parseTabular(geojson, 'geojson'), {
      sourceName: 's',
      sourceUrl: 'u',
      license: 'l',
      datasetModifiedAt: null,
      datasetIsDrinkingFountains: true,
    });
    expect(result.records[0]?.payload).toMatchObject({
      latitude: 45.76,
      longitude: 4.83,
      water_type: 'still_and_sparkling',
    });
  });
});

describe('client HTTP', () => {
  it('réessaie sur 503 puis réussit, en respectant l’attente exponentielle', async () => {
    const delays: number[] = [];
    let calls = 0;
    const http = createHttpClient({
      sleep: async (ms) => void delays.push(ms),
      fetchImpl: async () => {
        calls += 1;
        return calls < 3 ? new Response('busy', { status: 503 }) : Response.json({ ok: true });
      },
    });
    await expect(http.getJson('https://example.invalid')).resolves.toEqual({ ok: true });
    expect(delays).toEqual([2000, 4000]);
  });

  it('ne réessaie pas une erreur 404', async () => {
    let calls = 0;
    const http = createHttpClient({
      sleep: async () => undefined,
      fetchImpl: async () => {
        calls += 1;
        return new Response('missing', { status: 404 });
      },
    });
    await expect(http.getText('https://example.invalid')).rejects.toBeInstanceOf(HttpError);
    expect(calls).toBe(1);
  });
});

/** Client HTTP simulé : réponses fournies par URL (aucun appel réseau). */
function fakeHttp(routes: Record<string, unknown>): HttpClient {
  const find = (url: string) => {
    const key = Object.keys(routes).find((prefix) => url.startsWith(prefix));
    if (!key) throw new Error(`URL non simulée : ${url}`);
    return routes[key];
  };
  return {
    getJson: async (url) => find(url) as never,
    getText: async (url) => String(find(url)),
    postForm: async (url) => find(url) as never,
  };
}

describe('connecteurs (réponses simulées)', () => {
  it('data.gouv.fr : un jeu en échec n’empêche pas les autres', async () => {
    const http = fakeHttp({
      'https://www.data.gouv.fr/api/1/datasets/': {
        next_page: null,
        total: 2,
        data: [
          {
            id: 'd1',
            title: 'Fontaines A',
            page: 'https://www.data.gouv.fr/d1',
            license: 'lov2',
            last_modified: '2026-09-01',
            organization: { name: 'Ville A' },
            resources: [
              { id: 'r1', title: 'csv', format: 'csv', url: 'https://files.invalid/a.csv' },
            ],
          },
          {
            id: 'd2',
            title: 'Fontaines B',
            page: 'https://www.data.gouv.fr/d2',
            license: 'odbl',
            last_modified: '2026-09-01',
            resources: [{ id: 'r2', title: 'pdf', format: 'pdf', url: 'x' }],
          },
        ],
      },
      'https://files.invalid/a.csv': 'id,lat,lon\n1,48.1,2.1\n',
    });
    const result = await createDatagouvConnector().run({ http, log: () => undefined });
    expect(result.records.map((r) => r.externalId)).toEqual(['d1:1']);
    expect(
      result.notes.some((n) => n.includes('Fontaines B') && n.includes('aucune ressource')),
    ).toBe(true);
  });

  it('Opendatasoft : échoue explicitement si la structure du jeu change', async () => {
    const source = OPENDATASOFT_SOURCES[0]!;
    const base = `${source.portal}/api/explore/v2.1/catalog/datasets/${source.datasetId}`;
    const http = fakeHttp({
      [`${base}/exports/json`]: [{ autre_champ: 1 }],
      [base]: { metas: { default: {} } },
    });
    await expect(
      createOpendatasoftConnector(source).run({ http, log: () => undefined }),
    ).rejects.toThrow('Champs requis absents');
  });

  it('Opendatasoft : disponibilité et eau pétillante', async () => {
    const source = OPENDATASOFT_SOURCES[0]!;
    const base = `${source.portal}/api/explore/v2.1/catalog/datasets/${source.datasetId}`;
    const http = fakeHttp({
      [`${base}/exports/json`]: [
        {
          gid: 7,
          type_objet: 'FONTAINE PETILLANTE',
          dispo: 'NON',
          geo_point_2d: { lat: 48.86, lon: 2.34 },
          voie: 'RUE TEST',
          commune: 'PARIS',
        },
      ],
      [base]: { metas: { default: { modified: '2026-10-01T00:00:00Z', license: 'ODbL' } } },
    });
    const result = await createOpendatasoftConnector(source).run({ http, log: () => undefined });
    const record = result.records[0] as ImportRecord;
    expect(record.externalId).toBe('fontaines-a-boire:7');
    expect(record.payload).toMatchObject({
      operational_status: 'out_of_order',
      water_type: 'still_and_sparkling',
      potability: 'declared_potable',
      address: 'RUE TEST',
      license: 'ODbL',
    });
  });
});
