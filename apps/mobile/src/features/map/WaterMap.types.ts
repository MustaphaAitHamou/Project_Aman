import type { BBox, LngLat } from '@water-finder/core';
import type { Ref } from 'react';

import type { UserPosition } from '@/services/location/types';
import type { MapColors } from '@/theme/colors';

import type { PointFeatureCollection } from './geojson';

export interface MapViewport {
  bounds: BBox;
  zoom: number;
  center: LngLat;
  /** Vrai si le mouvement provient d'un geste de l'utilisateur. */
  userInteraction: boolean;
}

export interface CameraPadding {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export function toFullPadding(padding: CameraPadding | undefined) {
  return {
    top: padding?.top ?? 0,
    right: padding?.right ?? 0,
    bottom: padding?.bottom ?? 0,
    left: padding?.left ?? 0,
  };
}

export interface WaterMapHandle {
  flyTo: (center: LngLat, zoom?: number, padding?: CameraPadding) => void;
  easeTo: (center: LngLat, zoom?: number, padding?: CameraPadding) => void;
}

export interface WaterMapProps {
  ref?: Ref<WaterMapHandle>;
  styleUrl: string;
  initialCenter: LngLat;
  initialZoom: number;
  points: PointFeatureCollection;
  userPosition: UserPosition | null;
  selectedPointId: string | null;
  colors: MapColors;
  clusterFont: string;
  /** Marges occupées par les éléments superposés (barre de recherche, contrôles). */
  insets: { top: number; bottom: number };
  onViewportChange: (viewport: MapViewport) => void;
  onPointPress: (id: string) => void;
  onMapPress: () => void;
  onStyleError: () => void;
  testID?: string;
}
