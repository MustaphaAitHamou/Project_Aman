import type {
  CircleLayerSpecification,
  ExpressionSpecification,
  FilterSpecification,
  SymbolLayerSpecification,
} from '@maplibre/maplibre-gl-style-spec';

import type { MapColors } from '@/theme/colors';

import { LAYER_IDS } from './map-config';

/**
 * Couches de la carte au format MapLibre Style Spec, partagées entre le rendu natif
 * (@maplibre/maplibre-react-native) et le rendu web (maplibre-gl). La source est ajoutée
 * par chaque implémentation.
 */

export type CircleLayer = Omit<CircleLayerSpecification, 'source'>;
export type SymbolLayer = Omit<SymbolLayerSpecification, 'source'>;

const IS_CLUSTER: ExpressionSpecification = ['has', 'point_count'];
const IS_POINT: ExpressionSpecification = ['!', ['has', 'point_count']];
const IS_OUT_OF_ORDER: ExpressionSpecification = ['==', ['get', 'operational'], 'out_of_order'];

function potabilityColor(colors: MapColors): ExpressionSpecification {
  return [
    'match',
    ['get', 'potability'],
    'certified_potable',
    colors.pointCertified,
    'declared_potable',
    colors.pointDeclared,
    'not_potable',
    colors.pointNotPotable,
    colors.pointUnknown,
  ];
}

export function clusterLayer(colors: MapColors): CircleLayer {
  return {
    id: LAYER_IDS.clusters,
    type: 'circle',
    filter: IS_CLUSTER,
    paint: {
      'circle-color': colors.cluster,
      'circle-radius': ['step', ['get', 'point_count'], 17, 10, 21, 50, 26, 200, 31],
      'circle-stroke-width': 3,
      'circle-stroke-color': colors.clusterStroke,
      'circle-opacity': 0.95,
    },
  };
}

export function clusterCountLayer(colors: MapColors, font: string): SymbolLayer {
  return {
    id: LAYER_IDS.clusterCount,
    type: 'symbol',
    filter: IS_CLUSTER,
    layout: {
      'text-field': ['to-string', ['get', 'point_count']],
      'text-font': [font],
      'text-size': 14,
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: { 'text-color': colors.clusterText },
  };
}

/**
 * Point plein coloré selon la potabilité ; point évidé (cercle de couleur sur fond blanc)
 * lorsqu'un dysfonctionnement est signalé.
 */
export function pointLayer(colors: MapColors): CircleLayer {
  const color = potabilityColor(colors);
  return {
    id: LAYER_IDS.points,
    type: 'circle',
    filter: IS_POINT,
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 5, 14, 8, 17, 11],
      'circle-color': ['case', IS_OUT_OF_ORDER, colors.pointOutOfOrderFill, color],
      'circle-stroke-color': ['case', IS_OUT_OF_ORDER, color, colors.pointStroke],
      'circle-stroke-width': ['case', IS_OUT_OF_ORDER, 3, 2],
    },
  };
}

export function selectedFilter(selectedId: string | null): FilterSpecification {
  return ['all', IS_POINT, ['==', ['get', 'id'], selectedId ?? '']];
}

export function selectedLayer(colors: MapColors, selectedId: string | null): CircleLayer {
  return {
    id: LAYER_IDS.selected,
    type: 'circle',
    filter: selectedFilter(selectedId),
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 11, 14, 15, 17, 19],
      'circle-color': 'rgba(0, 0, 0, 0)',
      'circle-stroke-color': colors.selectedHalo,
      'circle-stroke-width': 4,
    },
  };
}

/**
 * Rayon (en pixels) d'un cercle de `meters` mètres à la latitude donnée, selon le zoom.
 * MapLibre utilise des tuiles de 512 px : 78 271,517 m/px au zoom 0 à l'équateur.
 * L'interpolation exponentielle de base 2 reproduit exactement le doublement par niveau de zoom.
 */
export function metersToPixelsExpression(
  meters: number,
  latitude: number,
): ExpressionSpecification {
  const metersPerPixelAtZoom0 = 78271.517 * Math.cos((latitude * Math.PI) / 180);
  const radiusAtZoom0 = meters / Math.max(metersPerPixelAtZoom0, 1e-6);
  return [
    'interpolate',
    ['exponential', 2],
    ['zoom'],
    0,
    radiusAtZoom0,
    22,
    radiusAtZoom0 * 2 ** 22,
  ];
}

export function userAccuracyLayer(
  colors: MapColors,
  accuracy: number,
  latitude: number,
): CircleLayer {
  return {
    id: LAYER_IDS.userAccuracy,
    type: 'circle',
    paint: {
      'circle-radius': metersToPixelsExpression(Math.max(accuracy, 0), latitude),
      'circle-color': colors.userAccuracy,
      'circle-pitch-alignment': 'map',
    },
  };
}

export function userDotLayer(colors: MapColors): CircleLayer {
  return {
    id: LAYER_IDS.userDot,
    type: 'circle',
    paint: {
      'circle-radius': 7,
      'circle-color': colors.userLocation,
      'circle-stroke-width': 3,
      'circle-stroke-color': colors.userLocationStroke,
    },
  };
}
