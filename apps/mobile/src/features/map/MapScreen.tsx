import { toLngLat } from '@water-finder/core';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Banner, EmptyState, IconButton } from '@/components/ui';
import { env } from '@/config/env';
import { openDirections } from '@/services/directions';
import {
  useWaterPointsInViewport,
  type Viewport,
} from '@/services/water-points/useWaterPointsInViewport';
import { useLocationStore } from '@/stores/location';
import { useMapCameraStore } from '@/stores/map-camera';
import { usePreferencesStore } from '@/stores/preferences';
import { useAppTheme } from '@/theme';

import { getActiveFilters } from './active-filters';
import { ActiveFiltersBar } from './ActiveFiltersBar';
import { toPointFeatureCollection } from './geojson';
import { FRANCE_CAMERA, PREVIEW_PANEL_PADDING, USER_ZOOM } from './map-config';
import { selectMapNotice, type NoticeAction } from './map-notice';
import { MapNoticeBanner } from './MapNoticeBanner';
import { MapSearchBar } from './MapSearchBar';
import { PointPreviewPanel } from './PointPreviewPanel';
import { WaterMap } from './WaterMap';
import type { MapViewport, WaterMapHandle } from './WaterMap.types';

const SEARCH_BAR_HEIGHT = 52;

export function MapScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<WaterMapHandle>(null);

  const filters = usePreferencesStore((state) => state.filters);
  const updateFilters = usePreferencesStore((state) => state.updateFilters);
  const resetFilters = usePreferencesStore((state) => state.resetFilters);
  const distanceUnit = usePreferencesStore((state) => state.distanceUnit);

  const position = useLocationStore((state) => state.position);
  const permission = useLocationStore((state) => state.permission);
  const canAskAgain = useLocationStore((state) => state.canAskAgain);
  const trackingStatus = useLocationStore((state) => state.status);
  const requestPermission = useLocationStore((state) => state.requestPermission);

  const pendingTarget = useMapCameraStore((state) => state.pendingTarget);
  const clearPendingTarget = useMapCameraStore((state) => state.clearPendingTarget);

  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [styleError, setStyleError] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [panelHeight, setPanelHeight] = useState(0);
  const [initialCamera] = useState(() =>
    position ? { center: toLngLat(position), zoom: USER_ZOOM } : FRANCE_CAMERA,
  );

  /** L'utilisateur a déplacé la carte : on ne la recentre plus automatiquement. */
  const userMovedMapRef = useRef(false);
  const hasCenteredOnUserRef = useRef(false);
  /** Recentrage demandé avant que la première position soit connue. */
  const recenterRequestedRef = useRef(false);

  const data = useWaterPointsInViewport(viewport, filters);
  const points = useMemo(() => (data.status === 'ready' ? data.points : []), [data]);
  const featureCollection = useMemo(() => toPointFeatureCollection(points), [points]);
  const selectedPoint = selectedId
    ? (points.find((point) => point.id === selectedId) ?? null)
    : null;
  const activeFilterCount = getActiveFilters(filters).length;

  const flyToUser = () => {
    if (!position) return false;
    mapRef.current?.flyTo(toLngLat(position), Math.max(viewport?.zoom ?? 0, USER_ZOOM));
    return true;
  };

  // Premier positionnement automatique, ou recentrage demandé en attente d'une position.
  useEffect(() => {
    if (!position) return;
    const firstFix = !hasCenteredOnUserRef.current && !userMovedMapRef.current;
    if (firstFix || recenterRequestedRef.current) {
      hasCenteredOnUserRef.current = true;
      recenterRequestedRef.current = false;
      mapRef.current?.flyTo(toLngLat(position), USER_ZOOM);
    }
  }, [position]);

  const recenter = async () => {
    userMovedMapRef.current = true;
    if (permission === 'granted') {
      if (trackingStatus === 'services_disabled') {
        void Linking.openSettings();
        return;
      }
      if (!flyToUser()) recenterRequestedRef.current = true;
      return;
    }
    if (permission === 'denied' && !canAskAgain) {
      void Linking.openSettings();
      return;
    }
    const result = await requestPermission();
    if (result === 'granted') recenterRequestedRef.current = true;
  };

  // Déplacements demandés depuis un autre écran (ex. choix d'une ville dans la recherche).
  useEffect(() => {
    if (!pendingTarget) return;
    clearPendingTarget();
    userMovedMapRef.current = true;
    if (pendingTarget.followUser) {
      void recenter();
    } else {
      mapRef.current?.flyTo(pendingTarget.center, pendingTarget.zoom);
    }
    // `recenter` lit l'état courant ; seule une nouvelle cible doit déclencher l'effet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingTarget, clearPendingTarget]);

  const notice = selectMapNotice({
    data,
    permission,
    canAskAgain,
    trackingStatus,
    activeFilterCount,
  });

  const handleNoticeAction = (action: NoticeAction) => {
    switch (action) {
      case 'retry':
        if (data.status === 'error') data.retry();
        break;
      case 'request_location':
        void recenter();
        break;
      case 'open_settings':
        void Linking.openSettings();
        break;
      case 'reset_filters':
        resetFilters();
        break;
    }
  };

  const handleViewportChange = (next: MapViewport) => {
    if (next.userInteraction) userMovedMapRef.current = true;
    setViewport({ bounds: next.bounds, zoom: next.zoom });
  };

  const handlePointPress = (id: string) => {
    const point = points.find((candidate) => candidate.id === id);
    setSelectedId(id);
    if (point) {
      userMovedMapRef.current = true;
      mapRef.current?.easeTo(toLngLat(point.location), undefined, {
        bottom: PREVIEW_PANEL_PADDING,
      });
    }
  };

  const topOverlayHeight = insets.top + theme.space.sm + SEARCH_BAR_HEIGHT;

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.surfaceMuted }]} testID="map-screen">
      {styleError ? (
        <View style={[styles.flex, styles.center, { paddingTop: topOverlayHeight }]}>
          <EmptyState
            testID="map-style-error"
            icon="map-marker-off-outline"
            tone="error"
            title={t('map.styleErrorTitle')}
            body={t('map.styleErrorBody')}
            action={{
              label: t('common.retry'),
              icon: 'refresh',
              onPress: () => {
                setStyleError(false);
                setMapKey((key) => key + 1);
              },
            }}
          />
        </View>
      ) : (
        <WaterMap
          key={mapKey}
          ref={mapRef}
          testID="water-map"
          styleUrl={env.mapStyleUrl}
          initialCenter={initialCamera.center}
          initialZoom={initialCamera.zoom}
          points={featureCollection}
          userPosition={position}
          selectedPointId={selectedPoint?.id ?? null}
          colors={theme.colors.map}
          clusterFont={env.mapFont}
          insets={{ top: topOverlayHeight, bottom: 8 }}
          onViewportChange={handleViewportChange}
          onPointPress={handlePointPress}
          onMapPress={() => setSelectedId(null)}
          onStyleError={() => setStyleError(true)}
        />
      )}

      <View
        style={[
          styles.topOverlay,
          {
            paddingTop: insets.top + theme.space.sm,
            paddingHorizontal: theme.space.md,
            gap: theme.space.sm,
          },
        ]}
      >
        <MapSearchBar
          activeFilterCount={activeFilterCount}
          onPressSearch={() => router.navigate('/search')}
          onPressFilters={() => router.push('/filters')}
        />
        <ActiveFiltersBar filters={filters} onChange={updateFilters} />
        {env.demoData ? (
          <Banner
            tone="warning"
            icon="flask-outline"
            message={t('map.demoBanner')}
            live={false}
            testID="demo-banner"
          />
        ) : null}
        {notice ? <MapNoticeBanner notice={notice} onAction={handleNoticeAction} /> : null}
      </View>

      <View
        style={[
          styles.controls,
          {
            right: theme.space.md,
            bottom: (selectedPoint ? panelHeight : 0) + theme.space.lg,
            gap: theme.space.md,
          },
        ]}
      >
        <IconButton
          testID="legend-button"
          icon="information-outline"
          accessibilityLabel={t('map.legend')}
          onPress={() => router.push('/map-legend')}
        />
        <IconButton
          testID="recenter-button"
          icon={permission === 'granted' && position ? 'crosshairs-gps' : 'crosshairs'}
          accessibilityLabel={t('map.recenter')}
          onPress={() => void recenter()}
        />
      </View>

      {selectedPoint ? (
        <PointPreviewPanel
          point={selectedPoint}
          userPosition={position}
          distanceUnit={distanceUnit}
          onLayout={(event) => setPanelHeight(event.nativeEvent.layout.height)}
          onClose={() => setSelectedId(null)}
          onOpenDetails={() =>
            router.push({ pathname: '/point/[id]', params: { id: selectedPoint.id } })
          }
          onDirections={() => openDirections(selectedPoint.location, t)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    pointerEvents: 'box-none',
  },
  controls: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
    pointerEvents: 'box-none',
  },
});
