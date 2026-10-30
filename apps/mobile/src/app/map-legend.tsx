import { POTABILITY_STATUSES, type PotabilityStatus } from '@water-finder/core';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText, Screen, Section } from '@/components/ui';
import { useAppTheme, type MapColors } from '@/theme';

const POTABILITY_COLOR: Record<PotabilityStatus, keyof MapColors> = {
  certified_potable: 'pointCertified',
  declared_potable: 'pointDeclared',
  not_potable: 'pointNotPotable',
  unknown: 'pointUnknown',
};

function Swatch({
  fill,
  stroke,
  strokeWidth = 2,
  size = 20,
}: {
  fill: string;
  stroke: string;
  strokeWidth?: number;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: fill,
        borderColor: stroke,
        borderWidth: strokeWidth,
      }}
    />
  );
}

function LegendRow({
  swatch,
  title,
  body,
}: {
  swatch: React.ReactNode;
  title: string;
  body?: string;
}) {
  const theme = useAppTheme();
  return (
    <View
      style={[styles.row, { gap: theme.space.md, paddingHorizontal: theme.space.lg }]}
      accessible
    >
      <View style={styles.swatchBox}>{swatch}</View>
      <View style={styles.text}>
        <AppText variant="callout">{title}</AppText>
        {body ? (
          <AppText variant="footnote" tone="secondary">
            {body}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

export default function MapLegendScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const map = colors.map;

  return (
    <Screen safeTop={false} testID="legend-screen">
      <Section title={t('legend.markersTitle')}>
        {POTABILITY_STATUSES.map((status) => (
          <LegendRow
            key={status}
            swatch={<Swatch fill={map[POTABILITY_COLOR[status]]} stroke={map.pointStroke} />}
            title={t(`point.potability.${status}`)}
          />
        ))}
      </Section>
      <Section>
        <LegendRow
          swatch={
            <Swatch fill={map.pointOutOfOrderFill} stroke={map.pointDeclared} strokeWidth={3} />
          }
          title={t('legend.outOfOrderTitle')}
          body={t('legend.outOfOrderBody')}
        />
        <LegendRow
          swatch={
            <Swatch fill={map.cluster} stroke={map.clusterStroke} strokeWidth={3} size={30} />
          }
          title={t('legend.clusterTitle')}
          body={t('legend.clusterBody')}
        />
        <LegendRow
          swatch={
            <Swatch fill={map.userLocation} stroke={map.userLocationStroke} strokeWidth={3} />
          }
          title={t('legend.userTitle')}
          body={t('legend.userBody')}
        />
      </Section>
      <AppText variant="footnote" tone="muted">
        {t('point.potabilityDisclaimer')}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  swatchBox: {
    width: 32,
    alignItems: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
});
