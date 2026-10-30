import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon, IconButton } from '@/components/ui';
import { useAppTheme } from '@/theme';

export interface MapSearchBarProps {
  onPressSearch: () => void;
  onPressFilters: () => void;
  activeFilterCount: number;
}

/** Barre flottante : accès à la recherche et aux filtres, utilisable d'une seule main. */
export function MapSearchBar({
  onPressSearch,
  onPressFilters,
  activeFilterCount,
}: MapSearchBarProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const filtersLabel =
    activeFilterCount > 0
      ? `${t('map.filters')}, ${t('map.filtersCount', { count: activeFilterCount })}`
      : t('map.filters');

  return (
    <View style={[styles.row, { gap: theme.space.sm }]}>
      <Pressable
        testID="map-search-bar"
        accessibilityRole="search"
        accessibilityLabel={t('map.searchPlaceholder')}
        onPress={onPressSearch}
        style={({ pressed }) => [
          styles.search,
          {
            gap: theme.space.sm,
            paddingHorizontal: theme.space.lg,
            borderRadius: theme.radius.pill,
            backgroundColor: pressed ? theme.colors.surfaceMuted : theme.colors.surfaceElevated,
            boxShadow: theme.shadow.md,
          },
        ]}
      >
        <Icon name="magnify" size={22} color={theme.colors.primary} />
        <AppText variant="callout" tone="muted" numberOfLines={1} style={styles.placeholder}>
          {t('map.searchPlaceholder')}
        </AppText>
      </Pressable>
      <IconButton
        testID="map-filters-button"
        icon="tune-variant"
        accessibilityLabel={filtersLabel}
        onPress={onPressFilters}
        size={52}
        badge={activeFilterCount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  search: {
    flex: 1,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholder: {
    flex: 1,
  },
});
