import {
  formatDistance,
  haversineDistanceMeters,
  type DistanceUnit,
  type WaterPointSummary,
} from '@water-finder/core';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { ReduceMotion, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { AppText, Button, Icon, IconButton } from '@/components/ui';
import { FreshnessAndSource, PointFacts } from '@/features/water-points/components/PointFacts';
import { WaterPointStatusList } from '@/features/water-points/components/WaterPointStatusList';
import { KIND_ICONS } from '@/features/water-points/presentation';
import type { UserPosition } from '@/services/location/types';
import { useAppTheme } from '@/theme';

export interface PointPreviewPanelProps {
  point: WaterPointSummary;
  userPosition: UserPosition | null;
  distanceUnit: DistanceUnit;
  onClose: () => void;
  onOpenDetails: () => void;
  onDirections: () => void;
  onLayout?: (event: LayoutChangeEvent) => void;
}

/** Panneau inférieur affiché au toucher d'un point d'eau. */
export function PointPreviewPanel({
  point,
  userPosition,
  distanceUnit,
  onClose,
  onOpenDetails,
  onDirections,
  onLayout,
}: PointPreviewPanelProps) {
  const { t, i18n } = useTranslation();
  const theme = useAppTheme();
  const kindLabel = t(`point.kind.${point.kind}`);
  const distance = userPosition
    ? formatDistance(haversineDistanceMeters(userPosition, point.location), {
        locale: i18n.language,
        unit: distanceUnit,
      })
    : null;
  const subtitle = [
    point.name ? kindLabel : null,
    distance ? t('point.distance', { distance }) : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const showDisclaimer = point.potability === 'declared_potable' || point.potability === 'unknown';

  return (
    <Animated.View
      testID="point-preview"
      onLayout={onLayout}
      entering={SlideInDown.duration(260).reduceMotion(ReduceMotion.System)}
      exiting={SlideOutDown.duration(180).reduceMotion(ReduceMotion.System)}
      style={[
        styles.panel,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderTopLeftRadius: theme.radius.xl,
          borderTopRightRadius: theme.radius.xl,
          boxShadow: theme.shadow.lg,
        },
      ]}
    >
      <ScrollView
        bounces={false}
        contentContainerStyle={{ padding: theme.space.lg, gap: theme.space.md }}
      >
        <View style={[styles.header, { gap: theme.space.md }]}>
          <View style={[styles.kindIcon, { backgroundColor: theme.colors.primarySoft }]}>
            <Icon name={KIND_ICONS[point.kind]} size={26} color={theme.colors.onPrimarySoft} />
          </View>
          <View style={styles.headerText}>
            <AppText variant="title3" numberOfLines={2} accessibilityRole="header">
              {point.name ?? kindLabel}
            </AppText>
            {subtitle ? (
              <AppText variant="subhead" tone="secondary" testID="point-preview-subtitle">
                {subtitle}
              </AppText>
            ) : null}
          </View>
          <IconButton
            icon="close"
            variant="tinted"
            size={40}
            iconColor={theme.colors.textSecondary}
            accessibilityLabel={t('point.closePreview')}
            onPress={onClose}
            testID="point-preview-close"
          />
        </View>

        <WaterPointStatusList point={point} />
        {showDisclaimer ? (
          <AppText variant="footnote" tone="muted">
            {t('point.potabilityDisclaimer')}
          </AppText>
        ) : null}
        <PointFacts point={point} />
        <FreshnessAndSource point={point} />

        <View style={[styles.actions, { gap: theme.space.sm }]}>
          <Button
            label={t('point.directions')}
            icon="directions"
            onPress={onDirections}
            style={styles.action}
            testID="point-preview-directions"
          />
          <Button
            label={t('point.details')}
            variant="secondary"
            onPress={onOpenDetails}
            style={styles.action}
            testID="point-preview-details"
          />
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '64%',
    zIndex: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kindIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  actions: {
    flexDirection: 'row',
  },
  action: {
    flex: 1,
  },
});
