import 'maplibre-gl/dist/maplibre-gl.css';

import {
  AttributionControl,
  Map as MapLibreMap,
  setWorkerUrl,
  type GeoJSONSource,
  type MapGeoJSONFeature,
} from 'maplibre-gl';
import { useEffect, useEffectEvent, useImperativeHandle, useRef } from 'react';

import { parsePressedFeature, toUserFeatureCollection } from './geojson';
import {
  CLUSTER_MAX_ZOOM,
  CLUSTER_RADIUS,
  LAYER_IDS,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  SOURCE_ID,
  USER_SOURCE_ID,
} from './map-config';
import {
  clusterCountLayer,
  clusterLayer,
  metersToPixelsExpression,
  pointLayer,
  selectedFilter,
  selectedLayer,
  userAccuracyLayer,
  userDotLayer,
} from './map-layers';
import { toFullPadding, type WaterMapProps } from './WaterMap.types';

// Worker servi depuis `public/` (voir scripts/copy-maplibre-worker.mjs).
setWorkerUrl('/maplibre-gl-worker.mjs');

/** Carte web : maplibre-gl (même spécification de style que la version native). */
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
  onViewportChange,
  onPointPress,
  onMapPress,
  onStyleError,
  testID,
}: WaterMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const styleReadyRef = useRef(false);

  useImperativeHandle(
    ref,
    () => ({
      flyTo: (center, zoom, padding) =>
        mapRef.current?.flyTo({ center, zoom, padding: toFullPadding(padding), duration: 900 }),
      easeTo: (center, zoom, padding) =>
        mapRef.current?.easeTo({ center, zoom, padding: toFullPadding(padding), duration: 450 }),
    }),
    [],
  );

  const emitViewport = useEffectEvent((map: MapLibreMap, userInteraction: boolean) => {
    const bounds = map.getBounds();
    const center = map.getCenter();
    onViewportChange({
      bounds: [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
      zoom: map.getZoom(),
      center: [center.lng, center.lat],
      userInteraction,
    });
  });
  const handlePointPress = useEffectEvent((id: string) => onPointPress(id));
  const handleMapPress = useEffectEvent(() => onMapPress());
  const handleStyleError = useEffectEvent(() => onStyleError());

  /** (Ré)ajoute sources et couches : au chargement initial et après chaque changement de style. */
  const installLayers = useEffectEvent((map: MapLibreMap) => {
    if (!map.getSource(USER_SOURCE_ID)) {
      map.addSource(USER_SOURCE_ID, {
        type: 'geojson',
        data: toUserFeatureCollection(userPosition),
      });
      map.addLayer({
        ...userAccuracyLayer(colors, userPosition?.accuracy ?? 0, userPosition?.latitude ?? 0),
        source: USER_SOURCE_ID,
      });
      map.addLayer({ ...userDotLayer(colors), source: USER_SOURCE_ID });
    }
    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: points,
        cluster: true,
        clusterRadius: CLUSTER_RADIUS,
        clusterMaxZoom: CLUSTER_MAX_ZOOM,
      });
      map.addLayer({ ...clusterLayer(colors), source: SOURCE_ID });
      map.addLayer({ ...clusterCountLayer(colors, clusterFont), source: SOURCE_ID });
      map.addLayer({ ...pointLayer(colors), source: SOURCE_ID });
      map.addLayer({ ...selectedLayer(colors, selectedPointId), source: SOURCE_ID });
    }
  });

  // Création unique de la carte.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = new MapLibreMap({
      container,
      style: styleUrl,
      center: initialCenter,
      zoom: initialZoom,
      minZoom: MAP_MIN_ZOOM,
      maxZoom: MAP_MAX_ZOOM,
      attributionControl: false,
      pitchWithRotate: false,
    });
    mapRef.current = map;
    // Pas de contrôle de zoom : il chevaucherait les boutons flottants (zoom molette / pincement).
    map.addControl(new AttributionControl({ compact: true }), 'bottom-left');

    map.on('style.load', () => {
      styleReadyRef.current = true;
      installLayers(map);
      emitViewport(map, false);
    });
    map.on('moveend', (event) =>
      emitViewport(map, 'originalEvent' in event && !!event.originalEvent),
    );
    map.on('error', () => {
      // Avant le chargement du style, une erreur signifie que le fond de carte est indisponible.
      if (!styleReadyRef.current) handleStyleError();
    });
    map.on('click', (event) => {
      const layers = [LAYER_IDS.clusters, LAYER_IDS.points].filter((id) => map.getLayer(id));
      const features: MapGeoJSONFeature[] = layers.length
        ? map.queryRenderedFeatures(event.point, { layers })
        : [];
      const pressed = parsePressedFeature(features[0]);
      if (!pressed) {
        handleMapPress();
        return;
      }
      if (pressed.type === 'point') {
        handlePointPress(pressed.id);
        return;
      }
      const source = map.getSource<GeoJSONSource>(SOURCE_ID);
      void source
        ?.getClusterExpansionZoom(pressed.clusterId)
        .then((zoom) => map.easeTo({ center: pressed.coordinates, zoom, duration: 450 }))
        .catch(() => undefined);
    });
    for (const layerId of [LAYER_IDS.clusters, LAYER_IDS.points]) {
      map.on('mouseenter', layerId, () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', layerId, () => (map.getCanvas().style.cursor = ''));
    }

    return () => {
      styleReadyRef.current = false;
      mapRef.current = null;
      map.remove();
    };
    // Les valeurs initiales ne doivent pas recréer la carte.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Changement de style (ex. thème) sans recréer la carte.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReadyRef.current) return;
    styleReadyRef.current = false;
    map.setStyle(styleUrl);
  }, [styleUrl]);

  useEffect(() => {
    if (!styleReadyRef.current) return;
    mapRef.current?.getSource<GeoJSONSource>(SOURCE_ID)?.setData(points);
  }, [points]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReadyRef.current) return;
    map.getSource<GeoJSONSource>(USER_SOURCE_ID)?.setData(toUserFeatureCollection(userPosition));
    if (map.getLayer(LAYER_IDS.userAccuracy)) {
      map.setPaintProperty(
        LAYER_IDS.userAccuracy,
        'circle-radius',
        metersToPixelsExpression(userPosition?.accuracy ?? 0, userPosition?.latitude ?? 0),
      );
    }
  }, [userPosition]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReadyRef.current || !map.getLayer(LAYER_IDS.selected)) return;
    map.setFilter(LAYER_IDS.selected, selectedFilter(selectedPointId));
  }, [selectedPointId]);

  // Conteneur DOM natif : maplibre-gl manipule directement cet élément.
  return <div ref={containerRef} data-testid={testID} style={{ position: 'absolute', inset: 0 }} />;
}
