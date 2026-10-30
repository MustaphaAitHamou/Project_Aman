import type { WaterPointSummary } from '@water-finder/core';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText, StatusBadge } from '@/components/ui';
import { useAppTheme } from '@/theme';

import {
  AVAILABILITY_PRESENTATION,
  OPERATIONAL_PRESENTATION,
  POTABILITY_PRESENTATION,
} from '../presentation';

/**
 * Les trois dimensions sont affichées séparément et explicitement nommées,
 * pour ne jamais confondre potabilité, fonctionnement et accès.
 */
export function WaterPointStatusList({
  point,
}: {
  point: Pick<WaterPointSummary, 'potability' | 'operationalStatus' | 'availability'>;
}) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  const rows = [
    {
      key: 'potability',
      label: t('point.potabilityLabel'),
      value: t(`point.potability.${point.potability}`),
      ...POTABILITY_PRESENTATION[point.potability],
    },
    {
      key: 'operational',
      label: t('point.operationalLabel'),
      value: t(`point.operational.${point.operationalStatus}`),
      ...OPERATIONAL_PRESENTATION[point.operationalStatus],
    },
    {
      key: 'availability',
      label: t('point.availabilityLabel'),
      value: t(`point.availability.${point.availability}`),
      ...AVAILABILITY_PRESENTATION[point.availability],
    },
  ];

  return (
    <View style={{ gap: theme.space.sm }}>
      {rows.map((row) => (
        <View
          key={row.key}
          style={[styles.row, { gap: theme.space.md }]}
          accessible
          accessibilityLabel={`${row.label} : ${row.value}`}
        >
          <AppText variant="footnote" tone="secondary" style={styles.label}>
            {row.label}
          </AppText>
          <View style={styles.value}>
            <StatusBadge
              tone={row.tone}
              icon={row.icon}
              label={row.value}
              testID={`status-${row.key}`}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    width: 104,
    fontWeight: '600',
  },
  value: {
    flex: 1,
  },
});
