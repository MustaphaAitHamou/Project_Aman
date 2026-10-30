import { describe, expect, it } from 'vitest';

import {
  bboxAround,
  bboxCacheKey,
  bboxContains,
  bboxContainsPoint,
  buildDirectionsUrl,
  EARTH_RADIUS_METERS,
  expandBBox,
  formatDistance,
  fromLngLat,
  haversineDistanceMeters,
  isPlausibleCoordinates,
  isValidBBox,
  isValidCoordinates,
  normalizeBBox,
  quantizeBBox,
  sortByDistance,
  toLngLat,
  type BBox,
} from '../src';

const NBSP = ' ';
const paris = { latitude: 48.8566, longitude: 2.3522 };
const london = { latitude: 51.5074, longitude: -0.1278 };

describe('distance', () => {
  it('vaut 0 pour un même point', () => {
    expect(haversineDistanceMeters(paris, paris)).toBe(0);
  });

  it('un degré de latitude correspond à R·π/180 mètres', () => {
    const expected = (EARTH_RADIUS_METERS * Math.PI) / 180;
    const measured = haversineDistanceMeters(
      { latitude: 0, longitude: 0 },
      { latitude: 1, longitude: 0 },
    );
    expect(measured).toBeCloseTo(expected, 3);
  });

  it('Paris – Londres ≈ 343,5 km et la distance est symétrique', () => {
    const d = haversineDistanceMeters(paris, london);
    expect(d / 1000).toBeGreaterThan(343);
    expect(d / 1000).toBeLessThan(344);
    expect(haversineDistanceMeters(london, paris)).toBeCloseTo(d, 6);
  });

  it('trie par distance sans muter l’entrée', () => {
    const items = [
      { id: 'loin', location: london },
      { id: 'proche', location: { latitude: 48.86, longitude: 2.35 } },
    ];
    const sorted = sortByDistance(items, paris);
    expect(sorted.map((i) => i.id)).toEqual(['proche', 'loin']);
    expect(items[0]?.id).toBe('loin');
  });
});

describe('formatage des distances', () => {
  it('formate en mètres et kilomètres selon la locale française', () => {
    expect(formatDistance(3, { locale: 'fr' })).toBe(`5${NBSP}m`);
    expect(formatDistance(47, { locale: 'fr' })).toBe(`45${NBSP}m`);
    expect(formatDistance(123, { locale: 'fr' })).toBe(`120${NBSP}m`);
    expect(formatDistance(996, { locale: 'fr' })).toBe(`1${NBSP}km`);
    expect(formatDistance(1234, { locale: 'fr' })).toBe(`1,2${NBSP}km`);
    expect(formatDistance(12_345, { locale: 'fr' })).toBe(`12${NBSP}km`);
  });

  it('utilise le séparateur décimal de la locale anglaise', () => {
    expect(formatDistance(1234, { locale: 'en' })).toBe(`1.2${NBSP}km`);
  });

  it('gère le système impérial', () => {
    expect(formatDistance(100, { locale: 'en', unit: 'imperial' })).toBe(`330${NBSP}ft`);
    expect(formatDistance(1609.344, { locale: 'en', unit: 'imperial' })).toBe(`1${NBSP}mi`);
    expect(formatDistance(30_000, { locale: 'en', unit: 'imperial' })).toBe(`19${NBSP}mi`);
  });

  it('renvoie un tiret pour une valeur invalide', () => {
    expect(formatDistance(Number.NaN, { locale: 'fr' })).toBe('—');
    expect(formatDistance(-1, { locale: 'fr' })).toBe('—');
  });
});

describe('coordonnées', () => {
  it('valide les coordonnées et rejette (0, 0) comme invraisemblable', () => {
    expect(isValidCoordinates(paris)).toBe(true);
    expect(isValidCoordinates({ latitude: 91, longitude: 0 })).toBe(false);
    expect(isValidCoordinates({ latitude: Number.NaN, longitude: 0 })).toBe(false);
    expect(isValidCoordinates(null)).toBe(false);
    expect(isPlausibleCoordinates({ latitude: 0, longitude: 0 })).toBe(false);
  });

  it('convertit vers et depuis [lng, lat]', () => {
    expect(toLngLat(paris)).toEqual([2.3522, 48.8566]);
    expect(fromLngLat([2.3522, 48.8566])).toEqual(paris);
  });
});

describe('emprises (bbox)', () => {
  const viewport: BBox = [2.33, 48.85, 2.37, 48.87];

  it('valide et normalise', () => {
    expect(isValidBBox(viewport)).toBe(true);
    expect(isValidBBox([0, 10, 1, 5])).toBe(false);
    expect(normalizeBBox([-200, -95, 200, 95])).toEqual([-180, -85.051129, 180, 85.051129]);
    expect(normalizeBBox([170, 0, -170, 10])).toEqual([-180, 0, 180, 10]);
  });

  it('agrandit l’emprise de chaque côté', () => {
    const expanded = expandBBox(viewport, 0.25);
    expect(expanded[0]).toBeCloseTo(2.32, 6);
    expect(expanded[2]).toBeCloseTo(2.38, 6);
    expect(bboxContains(expanded, viewport)).toBe(true);
  });

  it('quantifie vers l’extérieur et reste stable lors de petits déplacements', () => {
    const q1 = quantizeBBox(viewport, 14.3);
    const q2 = quantizeBBox([2.3302, 48.8501, 2.3702, 48.8701], 14.7);
    expect(bboxContains(q1, viewport)).toBe(true);
    expect(bboxCacheKey(q1)).toBe(bboxCacheKey(q2));
  });

  it('calcule une emprise autour d’un point', () => {
    const box = bboxAround(paris, 1000);
    expect(bboxContainsPoint(box, paris)).toBe(true);
    const north = haversineDistanceMeters(paris, { latitude: box[3], longitude: paris.longitude });
    expect(north).toBeCloseTo(1000, 0);
  });
});

describe('itinéraires', () => {
  it('construit une URL Apple Plans', () => {
    expect(buildDirectionsUrl(paris, 'apple')).toBe(
      'https://maps.apple.com/?daddr=48.856600%2C2.352200&dirflg=w',
    );
  });

  it('construit une URL Google Maps', () => {
    expect(buildDirectionsUrl(paris, 'google', 'walking')).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=48.856600%2C2.352200&travelmode=walking',
    );
  });
});
