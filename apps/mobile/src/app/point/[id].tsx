import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import {
  AppText,
  Banner,
  Button,
  Card,
  EmptyState,
  Icon,
  ListItem,
  LoadingState,
  Screen,
  Section,
} from '@/components/ui';
import { FreshnessAndSource, PointFacts } from '@/features/water-points/components/PointFacts';
import { WaterPointStatusList } from '@/features/water-points/components/WaterPointStatusList';
import { KIND_ICONS } from '@/features/water-points/presentation';
import { openDirections } from '@/services/directions';
import { useWaterPoint } from '@/services/water-points/useWaterPoint';
import { useAppTheme } from '@/theme';

/** Fiche d'un point d'eau (version de base ; fiche complète en phase 4). */
export default function PointDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const query = useWaterPoint(id);

  if (query.isPending) return <LoadingState label={t('common.loading')} />;

  const point = query.data;
  if (!point) {
    return (
      <View style={[styles.flex, styles.center]}>
        <EmptyState
          icon="map-marker-off-outline"
          tone="neutral"
          title={t('pointDetail.notFoundTitle')}
          body={t('pointDetail.notFoundBody')}
          action={{ label: t('notFound.backToMap'), onPress: () => router.back() }}
        />
      </View>
    );
  }

  const kindLabel = t(`point.kind.${point.kind}`);

  return (
    <Screen safeTop={false} testID="point-detail">
      <View style={[styles.header, { gap: theme.space.md }]}>
        <View style={[styles.kindIcon, { backgroundColor: theme.colors.primarySoft }]}>
          <Icon name={KIND_ICONS[point.kind]} size={30} color={theme.colors.onPrimarySoft} />
        </View>
        <View style={styles.flex}>
          <AppText variant="title2" accessibilityRole="header">
            {point.name ?? kindLabel}
          </AppText>
          <AppText variant="subhead" tone="secondary">
            {[kindLabel, point.city].filter(Boolean).join(' · ')}
          </AppText>
        </View>
      </View>

      <Card style={{ gap: theme.space.md }}>
        <AppText variant="headline">{t('pointDetail.statusSection')}</AppText>
        <WaterPointStatusList point={point} />
        {point.potability !== 'certified_potable' ? (
          <AppText variant="footnote" tone="muted">
            {t('point.potabilityDisclaimer')}
          </AppText>
        ) : null}
      </Card>

      <Card style={{ gap: theme.space.md }}>
        <AppText variant="headline">{t('pointDetail.infoSection')}</AppText>
        <PointFacts point={point} />
        <FreshnessAndSource point={point} />
      </Card>

      <Button
        label={t('point.directions')}
        icon="directions"
        size="lg"
        onPress={() => openDirections(point.location, t)}
      />

      <Section title={t('pointDetail.sourceSection')}>
        {point.sources.map((source) => (
          <ListItem
            key={`${source.sourceKey}-${source.externalId ?? 'n/a'}`}
            icon="database-outline"
            title={source.sourceName}
            subtitle={
              [source.license, source.retrievedAt?.slice(0, 10)].filter(Boolean).join(' · ') ||
              undefined
            }
          />
        ))}
        <ListItem
          icon="map-marker-outline"
          title={t('pointDetail.coordinates')}
          subtitle={`${point.location.latitude.toFixed(6)}, ${point.location.longitude.toFixed(6)}`}
        />
        <ListItem icon="identifier" title={t('pointDetail.identifier')} subtitle={point.id} />
      </Section>

      <Banner
        tone="info"
        icon="progress-wrench"
        message={t('pointDetail.phaseNotice')}
        live={false}
      />
    </Screen>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kindIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
