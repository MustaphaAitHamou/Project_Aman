import {
  DEFAULT_FILTERS,
  type WaterPointFilters,
  type WaterPointSummary,
} from '@water-finder/core';

import type { ViewportData } from '@/services/water-points/useWaterPointsInViewport';

import { getActiveFilters } from '../active-filters';
import { parsePressedFeature, toPointFeatureCollection, toUserFeatureCollection } from '../geojson';
import { selectMapNotice, type MapNoticeInput } from '../map-notice';

const point: WaterPointSummary = {
  id: 'p1',
  name: null,
  kind: 'drinking_fountain',
  location: { latitude: 48.85, longitude: 2.35 },
  potability: 'declared_potable',
  operationalStatus: 'out_of_order',
  availability: 'available',
  waterType: 'still',
  isFree: true,
  wheelchairAccessible: null,
  lastVerifiedAt: null,
  primarySourceCategory: 'openstreetmap',
};

const ready = (points: WaterPointSummary[], truncated = false): ViewportData => ({
  status: 'ready',
  points,
  truncated,
  isFetching: false,
});

const input = (overrides: Partial<MapNoticeInput>): MapNoticeInput => ({
  data: ready([point]),
  permission: 'granted',
  canAskAgain: true,
  trackingStatus: 'tracking',
  activeFilterCount: 0,
  ...overrides,
});

describe('selectMapNotice', () => {
  it('aucun message quand tout va bien', () => {
    expect(selectMapNotice(input({}))).toBeNull();
  });

  it('priorise l’erreur de chargement', () => {
    const notice = selectMapNotice(
      input({ data: { status: 'error', retry: jest.fn() }, permission: 'denied' }),
    );
    expect(notice).toEqual({ message: 'loadError', tone: 'error', action: 'retry' });
  });

  it('propose d’autoriser ou d’ouvrir les réglages selon le refus', () => {
    expect(selectMapNotice(input({ permission: 'denied', canAskAgain: true }))?.action).toBe(
      'request_location',
    );
    expect(selectMapNotice(input({ permission: 'denied', canAskAgain: false }))).toMatchObject({
      message: 'locationBlocked',
      action: 'open_settings',
    });
  });

  it('signale le GPS désactivé et l’erreur de position', () => {
    expect(selectMapNotice(input({ trackingStatus: 'services_disabled' }))?.message).toBe(
      'locationServicesOff',
    );
    expect(selectMapNotice(input({ trackingStatus: 'error' }))?.message).toBe('locationError');
  });

  it('ne harcèle pas un utilisateur qui n’a pas encore choisi', () => {
    expect(selectMapNotice(input({ permission: 'undetermined' }))).toBeNull();
  });

  it('états de données', () => {
    expect(selectMapNotice(input({ data: { status: 'no_source' } }))?.message).toBe('noSource');
    expect(selectMapNotice(input({ data: { status: 'zoom_in' } }))?.message).toBe('zoomIn');
    expect(selectMapNotice(input({ data: { status: 'loading' } }))?.message).toBe('loading');
    expect(selectMapNotice(input({ data: ready([point], true) }))?.message).toBe('truncated');
    expect(selectMapNotice(input({ data: ready([]) }))?.message).toBe('emptyArea');
    expect(selectMapNotice(input({ data: ready([]), activeFilterCount: 2 }))).toMatchObject({
      message: 'noResults',
      action: 'reset_filters',
    });
  });
});

describe('filtres actifs', () => {
  it('aucune puce avec les filtres par défaut', () => {
    expect(getActiveFilters(DEFAULT_FILTERS)).toEqual([]);
  });

  it('une puce par filtre, chacune sachant se désactiver', () => {
    const filters: WaterPointFilters = {
      ...DEFAULT_FILTERS,
      potability: 'certified',
      freeOnly: true,
      includeDecorative: true,
    };
    const active = getActiveFilters(filters);
    expect(active.map((filter) => filter.key)).toEqual(['certified', 'free', 'decorative']);
    const restored = active.reduce<WaterPointFilters>(
      (acc, filter) => ({ ...acc, ...filter.reset }),
      filters,
    );
    expect(restored).toEqual(DEFAULT_FILTERS);
  });
});

describe('conversion GeoJSON', () => {
  it('produit des points [lng, lat] avec des propriétés minimales', () => {
    const collection = toPointFeatureCollection([point]);
    expect(collection.features[0]).toEqual({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [2.35, 48.85] },
      properties: { id: 'p1', potability: 'declared_potable', operational: 'out_of_order' },
    });
  });

  it('borne la précision affichée de la position utilisateur', () => {
    expect(toUserFeatureCollection(null).features).toHaveLength(0);
    const user = toUserFeatureCollection({
      latitude: 1,
      longitude: 2,
      accuracy: 99_999,
      timestamp: 0,
    });
    expect(user.features[0]?.properties.accuracy).toBe(2000);
  });

  it('distingue un groupe, un point et une entité inexploitable', () => {
    const cluster: GeoJSON.Feature = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [2.3, 48.8] },
      properties: { cluster: true, cluster_id: 42, point_count: 7 },
    };
    expect(parsePressedFeature(cluster)).toEqual({
      type: 'cluster',
      clusterId: 42,
      coordinates: [2.3, 48.8],
    });
    expect(parsePressedFeature(toPointFeatureCollection([point]).features[0])).toEqual({
      type: 'point',
      id: 'p1',
    });
    expect(parsePressedFeature(undefined)).toBeNull();
    expect(
      parsePressedFeature({ type: 'Feature', geometry: cluster.geometry, properties: { foo: 1 } }),
    ).toBeNull();
  });
});
