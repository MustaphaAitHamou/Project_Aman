import i18n from '@/i18n';
import { buildShareMessage } from '@/features/water-points/share';
import { adUnitId, GOOGLE_TEST_UNITS, INTERSTITIALS_ENABLED } from '@/services/ads/ad-units';
import { toAuthErrorCode, isValidEmail } from '@/services/auth/auth-service';
import { photoStoragePath } from '@/services/community/api';
import {
  parseGeocodingResponse,
  searchAddresses,
  zoomForResult,
} from '@/services/geocoding/geocoding';

describe('géocodage', () => {
  it('convertit une réponse GeoJSON et ignore les entrées invalides', () => {
    const results = parseGeocodingResponse({
      type: 'FeatureCollection',
      features: [
        {
          geometry: { type: 'Point', coordinates: [2.3522, 48.8566] },
          properties: {
            id: 'a',
            label: '1 Place de l’Hôtel de Ville 75004 Paris',
            context: '75, Paris',
            type: 'housenumber',
          },
        },
        { geometry: { coordinates: [200, 10] }, properties: { label: 'hors limites' } },
        { geometry: null, properties: { label: 'sans géométrie' } },
        { geometry: { coordinates: [1, 2] }, properties: {} },
      ],
    });
    expect(results).toEqual([
      {
        id: 'a',
        label: '1 Place de l’Hôtel de Ville 75004 Paris',
        context: '75, Paris',
        type: 'housenumber',
        center: [2.3522, 48.8566],
      },
    ]);
    expect(zoomForResult(results[0]!)).toBe(17);
    expect(parseGeocodingResponse(null)).toEqual([]);
  });

  it('n’interroge pas le service pour une saisie trop courte et n’envoie que le texte', async () => {
    const fetchImpl = jest.fn(async () => Response.json({ features: [] }));
    await expect(searchAddresses('pa', { fetchImpl })).resolves.toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
    await searchAddresses('rue de rivoli', { fetchImpl });
    const url = new URL(String((fetchImpl.mock.calls[0] as unknown[])[0]));
    expect(url.searchParams.get('q')).toBe('rue de rivoli');
    expect([...url.searchParams.keys()].sort()).toEqual(['index', 'limit', 'q']);
  });

  it('signale une erreur HTTP', async () => {
    const fetchImpl = jest.fn(async () => new Response('busy', { status: 503 }));
    await expect(searchAddresses('rue de rivoli', { fetchImpl })).rejects.toThrow(
      'geocoding_http_503',
    );
  });
});

describe('publicité', () => {
  it('blocs de test hors production, aucun bloc en production sans configuration ni sur le web', () => {
    expect(adUnitId('banner', { os: 'android', appEnv: 'development' })).toBe(
      GOOGLE_TEST_UNITS.android.banner,
    );
    expect(adUnitId('native', { os: 'ios', appEnv: 'staging' })).toBe(GOOGLE_TEST_UNITS.ios.native);
    expect(adUnitId('banner', { os: 'android', appEnv: 'production' })).toBeNull();
    expect(adUnitId('banner', { os: 'web', appEnv: 'development' })).toBeNull();
  });

  it('les interstitiels restent désactivés', () => {
    expect(INTERSTITIALS_ENABLED).toBe(false);
  });
});

describe('comptes', () => {
  it('traduit les erreurs Supabase Auth', () => {
    expect(toAuthErrorCode({ code: 'invalid_credentials', message: 'x' })).toBe(
      'invalid_credentials',
    );
    expect(toAuthErrorCode({ message: 'Email not confirmed' })).toBe('email_not_confirmed');
    expect(toAuthErrorCode({ code: 'user_already_exists' })).toBe('user_already_exists');
    expect(toAuthErrorCode({ code: 'over_email_send_rate_limit' })).toBe('rate_limited');
    expect(toAuthErrorCode(new TypeError('Network request failed'))).toBe('network');
    expect(toAuthErrorCode({ message: '???' })).toBe('unknown');
  });

  it('valide les adresses e-mail', () => {
    expect(isValidEmail(' a@b.fr ')).toBe(true);
    expect(isValidEmail('a@b')).toBe(false);
  });
});

describe('contributions', () => {
  it('chemin de photo conforme à la règle de stockage (<uid>/<id>.jpg)', () => {
    expect(photoStoragePath('u-1', 'ab/../cd')).toBe('u-1/abcd.jpg');
    expect(photoStoragePath('u-1', '9f1c-22')).toMatch(/^u-1\/[A-Za-z0-9_-]+\.jpg$/);
  });

  it('message de partage', () => {
    const message = buildShareMessage(
      {
        id: 'p1',
        name: null,
        kindLabel: 'Fontaine à boire',
        location: { latitude: 48.85, longitude: 2.35 },
      },
      i18n.t,
      'waterfinder://point/p1',
    );
    expect(message).toContain('Fontaine à boire');
    expect(message).toContain('waterfinder://point/p1');
    expect(message).toContain('48.85');
  });
});
