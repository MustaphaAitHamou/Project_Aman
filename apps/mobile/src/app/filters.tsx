import type { PotabilityFilter } from '@water-finder/core';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button, Screen, Section, SegmentedControl, ToggleRow } from '@/components/ui';
import { usePreferencesStore } from '@/stores/preferences';
import { useAppTheme } from '@/theme';

/** Filtres appliqués immédiatement à la carte (et mémorisés sur l'appareil). */
export default function FiltersScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const filters = usePreferencesStore((state) => state.filters);
  const updateFilters = usePreferencesStore((state) => state.updateFilters);
  const resetFilters = usePreferencesStore((state) => state.resetFilters);

  const potabilityOptions: { value: PotabilityFilter; label: string }[] = [
    { value: 'any', label: t('filters.potabilityAny') },
    { value: 'potable', label: t('filters.potabilityPotable') },
    { value: 'certified', label: t('filters.potabilityCertified') },
  ];

  return (
    <Screen safeTop={false} testID="filters-screen">
      <Section title={t('filters.potabilityTitle')} footer={t('filters.potabilityHint')}>
        <View style={{ padding: theme.space.md }}>
          <SegmentedControl
            testID="filter-potability"
            accessibilityLabel={t('filters.potabilityTitle')}
            options={potabilityOptions}
            value={filters.potability}
            onChange={(potability) => updateFilters({ potability })}
          />
        </View>
      </Section>

      <Section title={t('filters.otherTitle')}>
        <ToggleRow
          testID="filter-hide-out-of-order"
          label={t('filters.hideOutOfOrder')}
          value={filters.hideOutOfOrder}
          onValueChange={(hideOutOfOrder) => updateFilters({ hideOutOfOrder })}
        />
        <ToggleRow
          testID="filter-sparkling"
          label={t('filters.sparklingOnly')}
          value={filters.sparklingOnly}
          onValueChange={(sparklingOnly) => updateFilters({ sparklingOnly })}
        />
        <ToggleRow
          testID="filter-free"
          label={t('filters.freeOnly')}
          value={filters.freeOnly}
          onValueChange={(freeOnly) => updateFilters({ freeOnly })}
        />
        <ToggleRow
          testID="filter-accessible"
          label={t('filters.accessibleOnly')}
          value={filters.accessibleOnly}
          onValueChange={(accessibleOnly) => updateFilters({ accessibleOnly })}
        />
        <ToggleRow
          testID="filter-decorative"
          label={t('filters.includeDecorative')}
          hint={t('filters.includeDecorativeHint')}
          value={filters.includeDecorative}
          onValueChange={(includeDecorative) => updateFilters({ includeDecorative })}
        />
      </Section>

      <View style={[styles.actions, { gap: theme.space.sm }]}>
        <Button
          label={t('filters.reset')}
          variant="secondary"
          icon="refresh"
          onPress={resetFilters}
          style={styles.action}
          testID="filters-reset"
        />
        <Button
          label={t('filters.apply')}
          onPress={() => router.back()}
          style={styles.action}
          testID="filters-apply"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
  },
  action: {
    flex: 1,
  },
});
