import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText, Icon } from '@/components/ui';
import type { PointAddressState } from '@/services/geocoding/usePointAddress';
import { useAppTheme } from '@/theme';

/** Ligne d'adresse d'un point d'eau ; « approximative » quand elle vient du géocodage inverse. */
export function PointAddress({ state, testID }: { state: PointAddressState; testID?: string }) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  if (state.status === 'unavailable') return null;

  const loading = state.status === 'loading';
  const text = loading ? t('point.address.loading') : state.text;
  const note = state.status === 'approximate' ? t('point.address.approximate') : null;

  return (
    <View
      testID={testID}
      style={[styles.row, { gap: theme.space.sm }]}
      accessible
      accessibilityLabel={`${t('point.address.label')} : ${text}${note ? ` (${note})` : ''}`}
    >
      <Icon
        name="map-marker-outline"
        size={18}
        color={loading ? theme.colors.textMuted : theme.colors.primary}
      />
      <View style={styles.text}>
        <AppText variant="subhead" tone={loading ? 'muted' : undefined} numberOfLines={2}>
          {text}
        </AppText>
        {note ? (
          <AppText variant="footnote" tone="muted">
            {note}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  text: {
    flex: 1,
  },
});
