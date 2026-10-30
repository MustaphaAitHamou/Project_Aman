import { getFreshness, type WaterPointSummary } from '@water-finder/core';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText, Icon, StatusBadge, type IconName } from '@/components/ui';
import { formatRelativeDate } from '@/lib/format';
import { useAppTheme } from '@/theme';

import { FRESHNESS_PRESENTATION } from '../presentation';

type FactsPoint = Pick<
  WaterPointSummary,
  'waterType' | 'isFree' | 'wheelchairAccessible' | 'lastVerifiedAt' | 'primarySourceCategory'
>;

const triState = (value: boolean | null): 'yes' | 'no' | 'unknown' =>
  value === null ? 'unknown' : value ? 'yes' : 'no';

/** Type d'eau, gratuité, accessibilité : « inconnu » est toujours affiché explicitement. */
export function PointFacts({ point }: { point: FactsPoint }) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  const facts: { key: string; icon: IconName; label: string; known: boolean }[] = [
    {
      key: 'water',
      icon: point.waterType === 'unknown' ? 'help-circle-outline' : 'cup-water',
      label: t(`point.waterType.${point.waterType}`),
      known: point.waterType !== 'unknown',
    },
    {
      key: 'free',
      icon:
        point.isFree === null ? 'help-circle-outline' : point.isFree ? 'cash-off' : 'currency-eur',
      label: t(`point.free.${triState(point.isFree)}`),
      known: point.isFree !== null,
    },
    {
      key: 'accessible',
      icon:
        point.wheelchairAccessible === null ? 'help-circle-outline' : 'wheelchair-accessibility',
      label: t(`point.accessible.${triState(point.wheelchairAccessible)}`),
      known: point.wheelchairAccessible !== null,
    },
  ];

  return (
    <View style={[styles.wrap, { gap: theme.space.sm }]}>
      {facts.map((fact) => (
        <View
          key={fact.key}
          style={[
            styles.fact,
            {
              gap: theme.space.xs,
              borderRadius: theme.radius.pill,
              borderColor: theme.colors.border,
              paddingHorizontal: theme.space.sm,
            },
          ]}
        >
          <Icon
            name={fact.icon}
            size={16}
            color={fact.known ? theme.colors.textSecondary : theme.colors.textMuted}
          />
          <AppText variant="footnote" tone={fact.known ? 'secondary' : 'muted'}>
            {fact.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

/** Date de vérification et source : une information ancienne est signalée en orange. */
export function FreshnessAndSource({ point }: { point: FactsPoint }) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const freshness = getFreshness(point.lastVerifiedAt);
  const relative = formatRelativeDate(point.lastVerifiedAt, t) ?? '';
  const presentation = FRESHNESS_PRESENTATION[freshness];

  return (
    <View style={{ gap: theme.space.xs }}>
      <StatusBadge
        tone={presentation.tone}
        icon={presentation.icon}
        label={t(`point.freshness.${freshness}`, { relative })}
        testID="freshness"
      />
      <AppText variant="footnote" tone="muted">
        {t('point.sourceLabel')} : {t(`point.source.${point.primarySourceCategory}`)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 30,
    borderWidth: 1,
  },
});
