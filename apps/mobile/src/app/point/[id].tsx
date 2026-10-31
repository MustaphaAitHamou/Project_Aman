import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, View } from 'react-native';

import {
  AppText,
  Banner,
  Button,
  Card,
  EmptyState,
  Icon,
  IconButton,
  ListItem,
  LoadingState,
  Screen,
  Section,
  StatusBadge,
} from '@/components/ui';
import { AdBanner } from '@/features/ads/AdBanner';
import { FreshnessAndSource, PointFacts } from '@/features/water-points/components/PointFacts';
import { PhotoStrip } from '@/features/water-points/components/PhotoStrip';
import { WaterPointStatusList } from '@/features/water-points/components/WaterPointStatusList';
import { KIND_ICONS } from '@/features/water-points/presentation';
import { sharePoint } from '@/features/water-points/share';
import { formatRelativeDate } from '@/lib/format';
import { useSessionStore } from '@/services/auth/session';
import { useIsFavorite, useToggleFavorite } from '@/services/community/hooks';
import { openDirections } from '@/services/directions';
import { useWaterPoint } from '@/services/water-points/useWaterPoint';
import { useAppTheme } from '@/theme';

/** Fiche complète d'un point d'eau. */
export default function PointDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const query = useWaterPoint(id);
  const signedIn = useSessionStore((state) => state.status === 'signedIn');
  const isFavorite = useIsFavorite(id);
  const toggleFavorite = useToggleFavorite();
  const point = query.data;

  useLayoutEffect(() => {
    if (!point) return;
    const kindLabel = t(`point.kind.${point.kind}`);
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <IconButton
            testID="point-share"
            icon="share-variant-outline"
            variant="plain"
            accessibilityLabel={t('pointDetail.share')}
            onPress={() => void sharePoint({ ...point, kindLabel }, t)}
          />
          <IconButton
            testID="point-favorite"
            icon={isFavorite ? 'heart' : 'heart-outline'}
            variant="plain"
            iconColor={isFavorite ? theme.colors.danger : undefined}
            accessibilityLabel={
              isFavorite ? t('pointDetail.unfavorite') : t('pointDetail.favorite')
            }
            disabled={toggleFavorite.isPending}
            onPress={() =>
              signedIn
                ? toggleFavorite.mutate({ pointId: point.id, favorite: !isFavorite })
                : router.push('/sign-in')
            }
          />
        </View>
      ),
    });
  }, [navigation, point, isFavorite, signedIn, toggleFavorite, router, t, theme.colors.danger]);

  if (query.isPending) return <LoadingState label={t('common.loading')} />;

  if (!point) {
    return (
      <View style={[styles.flex, styles.center]}>
        <EmptyState
          icon={query.isError ? 'alert-circle-outline' : 'map-marker-off-outline'}
          tone={query.isError ? 'error' : 'neutral'}
          title={query.isError ? t('errors.loadFailed') : t('pointDetail.notFoundTitle')}
          body={query.isError ? undefined : t('pointDetail.notFoundBody')}
          action={
            query.isError
              ? { label: t('common.retry'), icon: 'refresh', onPress: () => void query.refetch() }
              : { label: t('notFound.backToMap'), onPress: () => router.back() }
          }
        />
      </View>
    );
  }

  const kindLabel = t(`point.kind.${point.kind}`);
  const evidence = point.potabilityEvidence;
  const contribute = (
    pathname: '/report/[id]' | '/edit-point/[id]' | '/add-photo/[id]',
    type?: string,
  ) => router.push({ pathname, params: type ? { id: point.id, type } : { id: point.id } });

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
            {[kindLabel, point.address, point.city].filter(Boolean).join(' · ')}
          </AppText>
        </View>
      </View>

      {point.publicationStatus === 'pending' ? (
        <Banner
          tone="warning"
          icon="timer-sand"
          message={t('pointDetail.pendingNotice')}
          live={false}
        />
      ) : null}

      <Card style={{ gap: theme.space.md }}>
        <AppText variant="headline">{t('pointDetail.statusSection')}</AppText>
        <WaterPointStatusList point={point} />
        {point.operationalStatusAt ? (
          <AppText variant="footnote" tone="muted">
            {t('pointDetail.statusSince', {
              relative: formatRelativeDate(point.operationalStatusAt, t) ?? '',
            })}
          </AppText>
        ) : null}
      </Card>

      <Card style={{ gap: theme.space.sm }} testID="point-potability-evidence">
        <AppText variant="headline">{t('pointDetail.potabilitySection')}</AppText>
        {evidence ? (
          <>
            <AppText variant="callout">
              {t(`pointDetail.evidence.${evidence.kind}`)}
              {evidence.sourceName ? ` — ${evidence.sourceName}` : ''}
            </AppText>
            <AppText variant="footnote" tone="secondary">
              {evidence.observedAt
                ? t('pointDetail.evidenceDate', { date: evidence.observedAt.slice(0, 10) })
                : t('pointDetail.evidenceUndated')}
            </AppText>
            {evidence.url ? (
              <Button
                label={t('sources.openLink')}
                icon="open-in-new"
                variant="ghost"
                onPress={() => void Linking.openURL(evidence.url as string).catch(() => undefined)}
              />
            ) : null}
          </>
        ) : (
          <AppText variant="callout" tone="secondary">
            {t('pointDetail.noEvidence')}
          </AppText>
        )}
        {point.potability !== 'certified_potable' ? (
          <AppText variant="footnote" tone="muted">
            {t('point.potabilityDisclaimer')}
          </AppText>
        ) : null}
      </Card>

      <Button
        label={t('point.directions')}
        icon="directions"
        size="lg"
        onPress={() => openDirections(point.location, t)}
      />

      <Card style={{ gap: theme.space.md }}>
        <AppText variant="headline">{t('pointDetail.infoSection')}</AppText>
        <PointFacts point={point} />
        {point.openingHours ? (
          <AppText variant="subhead" tone="secondary">
            {t('pointDetail.openingHours', { hours: point.openingHours })}
          </AppText>
        ) : null}
        <FreshnessAndSource point={point} />
      </Card>

      <Card style={{ gap: theme.space.md }}>
        <AppText variant="headline">{t('pointDetail.photosSection')}</AppText>
        <PhotoStrip photos={point.photos} />
      </Card>

      {point.recentReports.length > 0 ? (
        <Section title={t('pointDetail.historySection')}>
          {point.recentReports.map((report, index) => (
            <ListItem
              key={`${report.type}-${report.createdAt}-${index}`}
              icon={
                report.type === 'fixed'
                  ? 'check-circle-outline'
                  : report.type === 'broken'
                    ? 'wrench-outline'
                    : 'map-marker-off-outline'
              }
              title={t(`report.type.${report.type}`)}
              subtitle={formatRelativeDate(report.createdAt, t) ?? undefined}
              trailing={
                <StatusBadge
                  tone={report.status === 'approved' ? 'success' : 'warning'}
                  label={t(`contributions.status.${report.status}`)}
                />
              }
            />
          ))}
        </Section>
      ) : null}

      <Section
        title={t('pointDetail.contributeSection')}
        footer={signedIn ? undefined : t('pointDetail.contributeFooter')}
      >
        <ListItem
          testID="point-report-broken"
          icon="wrench-outline"
          title={t('add.reportBroken')}
          onPress={() => contribute('/report/[id]', 'broken')}
        />
        <ListItem
          icon="check-circle-outline"
          title={t('add.reportFixed')}
          onPress={() => contribute('/report/[id]', 'fixed')}
        />
        <ListItem
          icon="map-marker-off-outline"
          title={t('add.reportMissing')}
          onPress={() => contribute('/report/[id]', 'not_existing')}
        />
        <ListItem
          icon="flag-outline"
          title={t('pointDetail.otherReport')}
          onPress={() => contribute('/report/[id]', 'other')}
        />
        <ListItem
          icon="pencil-outline"
          title={t('add.suggestEdit')}
          onPress={() => contribute('/edit-point/[id]')}
        />
        <ListItem
          icon="camera-outline"
          title={t('add.addPhoto')}
          onPress={() => contribute('/add-photo/[id]')}
        />
      </Section>

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
            onPress={
              source.url
                ? () => void Linking.openURL(source.url as string).catch(() => undefined)
                : undefined
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

      <AdBanner testID="point-ad" />
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
  headerActions: {
    flexDirection: 'row',
  },
  kindIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
