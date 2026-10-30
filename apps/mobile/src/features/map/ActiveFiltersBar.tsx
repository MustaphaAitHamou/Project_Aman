import type { WaterPointFilters } from '@water-finder/core';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';

import { Chip } from '@/components/ui';
import { useAppTheme } from '@/theme';

import { getActiveFilters } from './active-filters';

export interface ActiveFiltersBarProps {
  filters: WaterPointFilters;
  onChange: (patch: Partial<WaterPointFilters>) => void;
}

/** Filtres actifs, retirables d'un geste. Rien n'est affiché sans filtre actif. */
export function ActiveFiltersBar({ filters, onChange }: ActiveFiltersBarProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const active = getActiveFilters(filters);
  if (active.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.content, { gap: theme.space.sm }]}
      testID="active-filters"
    >
      {active.map((filter) => {
        const label = t(`filters.chip.${filter.key}`);
        return (
          <Chip
            key={filter.key}
            label={label}
            selected
            removable
            accessibilityLabel={t('filters.removeChip', { label })}
            onPress={() => onChange(filter.reset)}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: 2,
  },
});
