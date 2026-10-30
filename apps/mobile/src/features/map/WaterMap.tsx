import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  type CameraRef,
  type GeoJSONSourceRef,
  type MapRef,
  type ViewState,
} from '@maplibre/maplibre-react-native';
import { useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';

import { toUserFeatureCollection, parsePressedFeature } from './geojson';
import {
  CLUSTER_MAX_ZOOM,
  CLUSTER_RADIUS,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  SOURCE_ID,
  USER_SOURCE_ID,
} from './map-config';
import {
  clusterCountLayer,
  clusterLayer,
  pointLayer,
  selectedLayer,
  userAccuracyLayer,
  userDotLayer,
} from './map-layers';
import { toFullPadding, type MapViewport, type WaterMapProps } from './WaterMap.types';

/** Carte native (iOS / Android) : MapLibre Native via @maplibre/maplibre-react-native. */
export function WaterMap({
  ref,
  styleUrl,
  initialCenter,
  initialZoom,
  points,
  userPosition,
  selectedPointId,
  colors,
  clusterFont,
  insets,
  onViewportChange,
  onPointPress,
  onMapPress,
  onStyleError,
  testID,
}: WaterMapProps) {
  const mapRef = useRef<MapRef>(null);
  const cameraRef = useRef<CameraRef>(null);
  const sourceRef = useRef<GeoJSONSourceRef>(null);

  useImperativeHandle(
    ref,
    () => ({
      flyTo: (center, zoom, padding) =>
        cameraRef.current?.flyTo({ center, zoom, padding: toFullPadding(padding), duration: 900 }),
      easeTo: (center, zoom, padding) =>
        cameraRef.current?.easeTo({ center, zoom, padding: toFullPadding(padding), duration: 450 }),
    }),
    [],
  );

  const layers = useMemo(
    () => ({
      clusters: clusterLayer(colors),
      clusterCount: clusterCountLayer(colors, clusterFont),
      points: pointLayer(colors),
      userDot: userDotLayer(colors),
    }),
    [colors, clusterFont],
  );
  const userData = useMemo(() => toUserFeatureCollection(userPosition), [userPosition]);
  const accuracyLayer = userAccuracyLayer(
    colors,
    userPosition?.accuracy ?? 0,
    userPosition?.latitude ?? 0,
  );

  const emitViewport = (state: ViewState, userInteraction: boolean) => {
    const viewport: MapViewport = {
      bounds: state.bounds,
      zoom: state.zoom,
      center: state.center,
      userInteraction,
    };
    onViewportChange(viewport);
  };

  const handleSourcePress = async (features: GeoJSON.Feature[]) => {
    const pressed = parsePressedFeature(features.find((f) => f.properties?.cluster) ?? features[0]);
    if (!pressed) return;
    if (pressed.type === 'point') {
      onPointPress(pressed.id);
      return;
    }
    try {
      const zoom = await sourceRef.current?.getClusterExpansionZoom(pressed.clusterId);
      cameraRef.current?.easeTo({
        center: pressed.coordinates,
        zoom: Math.min(zoom ?? CLUSTER_MAX_ZOOM + 1, MAP_MAX_ZOOM),
        duration: 450,
      });
    } catch {
      cameraRef.current?.zoomTo(CLUSTER_MAX_ZOOM + 1, { duration: 450 });
    }
  };

  return (
    <Map
      ref={mapRef}
      testID={testID}
      style={StyleSheet.absoluteFill}
      mapStyle={styleUrl}
      logo={false}
      attribution
      attributionPosition={{ bottom: insets.bottom + 8, left: 8 }}
      compass
      compassPosition={{ top: insets.top + 8, right: 12 }}
      scaleBar={false}
      touchPitch={false}
      onDidFinishLoadingMap={() => {
        void mapRef.current
          ?.getViewState()
          .then((state) => emitViewport(state, false))
          .catch(() => undefined);
      }}
      onRegionDidChange={(event) =>
        emitViewport(event.nativeEvent, event.nativeEvent.userInteraction)
      }
      onDidFailLoadingMap={() => onStyleError()}
      onPress={() => onMapPress()}
    >
      <Camera
        ref={cameraRef}
        initialViewState={{ center: initialCenter, zoom: initialZoom }}
        minZoom={MAP_MIN_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
      />

      <GeoJSONSource id={USER_SOURCE_ID} data={userData}>
        <Layer {...accuracyLayer} source={USER_SOURCE_ID} />
        <Layer {...layers.userDot} source={USER_SOURCE_ID} />
      </GeoJSONSource>

      <GeoJSONSource
        id={SOURCE_ID}
        ref={sourceRef}
        data={points}
        cluster
        clusterRadius={CLUSTER_RADIUS}
        clusterMaxZoom={CLUSTER_MAX_ZOOM}
        onPress={(event) => {
          event.stopPropagation();
          void handleSourcePress(event.nativeEvent.features);
        }}
      >
        <Layer {...layers.clusters} source={SOURCE_ID} />
        <Layer {...layers.clusterCount} source={SOURCE_ID} />
        <Layer {...layers.points} source={SOURCE_ID} />
        <Layer {...selectedLayer(colors, selectedPointId)} source={SOURCE_ID} />
      </GeoJSONSource>
    </Map>
  );
}
