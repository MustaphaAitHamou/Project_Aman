import {
  MAX_REVERSE_DISTANCE_M,
  parseIgnReverseResponse,
  parsePhotonReverseResponse,
  reverseGeocode,
} from '@/services/geocoding/geocoding';
import { storedAddress } from '@/services/geocoding/usePointAddress';
import { potabilitySourceCategory } from '@/features/water-points/presentation';

// Réponses au format documenté (Géoplateforme `/geocodage/reverse`, Photon `/reverse`), construites
// pour les tests : elles ne proviennent pas d'un appel réel.
const ign = (label: string, distance?: number) => ({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [2.35, 48.85] },
      properties: { label, ...(distance === undefined ? {} : { distance }) },
    },
  ],
});

describe('géocodage inverse (adresse d’un point d’eau)', () => {
  it('lit le libellé et la distance de la Géoplateforme', () => {
    expect(parseIgnReverseResponse(ign('12 Rue de Rivoli 75004 Paris', 18))).toEqual({
      label: '12 Rue de Rivoli 75004 Paris',
      distanceM: 18,
    });
    expect(parseIgnReverseResponse({ features: [] })).toBeNull();
    expect(parseIgnReverseResponse('erreur')).toBeNull();
  });

  it('reconstitue une adresse Photon et calcule la distance au point', () => {
    const result = parsePhotonReverseResponse(
      {
        features: [
          {
            geometry: { type: 'Point', coordinates: [3.0589, 36.7539] },
            properties: { housenumber: '3', street: 'Rue Didouche Mourad', city: 'Alger' },
          },
        ],
      },
      [3.0588, 36.7538],
    );
    expect(result?.label).toBe('3 Rue Didouche Mourad, Alger');
    expect(result?.distanceM).toBeGreaterThan(0);
    expect(result?.distanceM).toBeLessThan(20);
  });

  it('n’envoie que les coordonnées du point et choisit le service selon la zone', async () => {
    const fetchImpl = jest.fn(async () =>
      Response.json(ign('Place de la Bastille 75011 Paris', 30)),
    );
    await expect(reverseGeocode([2.369, 48.853], { provider: 'ign', fetchImpl })).resolves.toEqual({
      label: 'Place de la Bastille 75011 Paris',
      distanceM: 30,
    });
    const url = new URL(String((fetchImpl.mock.calls[0] as unknown[])[0]));
    expect(url.pathname).toBe('/geocodage/reverse');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      lon: '2.36900',
      lat: '48.85300',
      limit: '1',
      index: 'address',
    });
  });

  it('écarte une adresse trop éloignée et signale une erreur HTTP', async () => {
    const far = jest.fn(async () =>
      Response.json(ign('Lieu-dit lointain', MAX_REVERSE_DISTANCE_M + 1)),
    );
    await expect(
      reverseGeocode([2.35, 48.85], { provider: 'ign', fetchImpl: far }),
    ).resolves.toBeNull();
    const failing = jest.fn(async () => new Response('', { status: 503 }));
    await expect(
      reverseGeocode([2.35, 48.85], { provider: 'photon', fetchImpl: failing }),
    ).rejects.toThrow('reverse_geocoding_http_503');
  });

  it('préfère l’adresse fournie par la source, sans répéter la ville', () => {
    expect(storedAddress({ address: '29 rue Gay-Lussac', city: 'Paris' })).toBe(
      '29 rue Gay-Lussac, Paris',
    );
    expect(storedAddress({ address: 'Place du Marché, Lyon', city: 'Lyon' })).toBe(
      'Place du Marché, Lyon',
    );
    expect(storedAddress({ address: '  ', city: null })).toBeNull();
  });
});

describe('provenance de la potabilité affichée', () => {
  it('suit la preuve, sinon la source principale ; rien si la potabilité est inconnue', () => {
    expect(
      potabilitySourceCategory({
        potability: 'declared_potable',
        potabilityEvidence: { kind: 'osm_tag' },
        primarySourceCategory: 'official',
      }),
    ).toBe('openstreetmap');
    expect(
      potabilitySourceCategory({
        potability: 'declared_potable',
        primarySourceCategory: 'community',
      }),
    ).toBe('community');
    expect(
      potabilitySourceCategory({
        potability: 'certified_potable',
        potabilityEvidence: { kind: 'sanitary_control' },
      }),
    ).toBe('official');
    expect(
      potabilitySourceCategory({ potability: 'unknown', primarySourceCategory: 'openstreetmap' }),
    ).toBeNull();
  });
});
