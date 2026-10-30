import { validateStyleMin, type StyleSpecification } from '@maplibre/maplibre-gl-style-spec';

import { lightColors } from '@/theme/colors';

import { EMPTY_POINTS, EMPTY_USER } from '../geojson';
import {
  CLUSTER_MAX_ZOOM,
  CLUSTER_RADIUS,
  LAYER_IDS,
  SOURCE_ID,
  USER_SOURCE_ID,
} from '../map-config';
import {
  clusterCountLayer,
  clusterLayer,
  metersToPixelsExpression,
  pointLayer,
  selectedLayer,
  userAccuracyLayer,
  userDotLayer,
} from '../map-layers';

/**
 * Les couches sont validées par le validateur officiel de la spécification MapLibre :
 * c'est ce que vérifieraient MapLibre Native et maplibre-gl au chargement.
 */
function buildStyle(selectedId: string | null): StyleSpecification {
  const colors = lightColors.map;
  return {
    version: 8,
    glyphs: 'https://example.org/fonts/{fontstack}/{range}.pbf',
    sources: {
      [SOURCE_ID]: {
        type: 'geojson',
        data: EMPTY_POINTS,
        cluster: true,
        clusterRadius: CLUSTER_RADIUS,
        clusterMaxZoom: CLUSTER_MAX_ZOOM,
      },
      [USER_SOURCE_ID]: { type: 'geojson', data: EMPTY_USER },
    },
    layers: [
      { ...userAccuracyLayer(colors, 25, 48.85), source: USER_SOURCE_ID },
      { ...userDotLayer(colors), source: USER_SOURCE_ID },
      { ...clusterLayer(colors), source: SOURCE_ID },
      { ...clusterCountLayer(colors, 'Noto Sans Bold'), source: SOURCE_ID },
      { ...pointLayer(colors), source: SOURCE_ID },
      { ...selectedLayer(colors, selectedId), source: SOURCE_ID },
    ],
  };
}

describe('couches MapLibre', () => {
  it.each([null, 'point-42'])('style valide (sélection : %s)', (selectedId) => {
    expect(validateStyleMin(buildStyle(selectedId))).toEqual([]);
  });

  it('identifiants de couches uniques', () => {
    const ids = buildStyle(null).layers.map((layer) => layer.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expect.arrayContaining(Object.values(LAYER_IDS)));
  });

  it('convertit un rayon en mètres en pixels, doublé à chaque niveau de zoom', () => {
    const expression = metersToPixelsExpression(100, 0);
    const [, , , zoom0, radius0, zoom22, radius22] = expression as unknown as number[];
    expect(zoom0).toBe(0);
    expect(zoom22).toBe(22);
    expect(radius0).toBeCloseTo(100 / 78271.517, 10);
    expect((radius22 as number) / (radius0 as number)).toBeCloseTo(2 ** 22, 0);
  });
});
