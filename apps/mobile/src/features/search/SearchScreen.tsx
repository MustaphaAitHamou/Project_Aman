import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Banner, EmptyState, ListItem } from '@/components/ui';
import { AdBanner } from '@/features/ads/AdBanner';
import { NativeAdCard } from '@/features/ads/NativeAdCard';
import {
  MIN_GEOCODING_QUERY,
  zoomForResult,
  type GeocodingResult,
} from '@/services/geocoding/geocoding';
import { useAddressSearch } from '@/services/geocoding/useAddressSearch';
import { SearchField } from '@/components/ui/SearchField';
import { USER_ZOOM } from '@/features/map/map-config';
import { useMapCameraStore } from '@/stores/map-camera';
import { useAppTheme } from '@/theme';

import { CITY_ZOOM, searchCities, type City } from './cities';

export function SearchScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const requestCamera = useMapCameraStore((state) => state.requestCamera);
  const [query, setQuery] = useState('');
  const results = searchCities(query);
  const addresses = useAddressSearch(query);
  const showAddresses = query.trim().length >= MIN_GEOCODING_QUERY;

  const goToAddress = (result: GeocodingResult) => {
    requestCamera({ center: result.center, zoom: zoomForResult(result) });
    router.navigate('/');
  };

  const goToCity = (city: City) => {
    requestCamera({ center: city.center, zoom: CITY_ZOOM });
    router.navigate('/');
  };

  const goNearMe = () => {
    requestCamera({ center: [0, 0], zoom: USER_ZOOM, followUser: true });
    router.navigate('/');
  };

  return (
    <View
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      testID="search-screen"
    >
      <View
        style={{
          paddingTop: insets.top + theme.space.lg,
          paddingHorizontal: theme.space.lg,
          paddingBottom: theme.space.md,
          gap: theme.space.md,
        }}
      >
        <AppText variant="title1" accessibilityRole="header">
          {t('search.title')}
        </AppText>
        <SearchField
          testID="search-input"
          value={query}
          onChangeText={setQuery}
          placeholder={t('search.placeholder')}
          accessibilityLabel={t('search.inputLabel')}
          clearLabel={t('common.reset')}
        />
      </View>
      <FlatList
        data={results}
        keyExtractor={(city) => city.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          paddingHorizontal: theme.space.lg,
          paddingBottom: theme.space['3xl'],
        }}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
        )}
        ListHeaderComponent={
          <View style={{ gap: theme.space.md, marginBottom: theme.space.sm }}>
            <ListItem
              testID="search-near-me"
              icon="crosshairs-gps"
              title={t('search.nearMe')}
              subtitle={t('search.nearMeBody')}
              onPress={goNearMe}
            />
            {showAddresses ? (
              <View style={{ gap: theme.space.xs }} testID="address-results">
                <AppText
                  variant="footnote"
                  tone="secondary"
                  accessibilityRole="header"
                  style={styles.sectionTitle}
                >
                  {t('search.addressesTitle')}
                </AppText>
                {addresses.isError ? (
                  <Banner tone="warning" icon="wifi-off" message={t('search.addressError')} />
                ) : addresses.isPending ? (
                  <AppText variant="subhead" tone="secondary">
                    {t('common.loading')}
                  </AppText>
                ) : addresses.data.length === 0 ? (
                  <AppText variant="subhead" tone="secondary">
                    {t('search.noAddress')}
                  </AppText>
                ) : (
                  addresses.data.map((result) => (
                    <ListItem
                      key={result.id}
                      icon="map-marker-outline"
                      title={result.label}
                      subtitle={result.context ?? undefined}
                      onPress={() => goToAddress(result)}
                    />
                  ))
                )}
                <AppText variant="caption" tone="muted">
                  {t('search.addressAttribution')}
                </AppText>
              </View>
            ) : (
              <Banner
                tone="info"
                icon="map-search-outline"
                message={t('search.addressHint')}
                live={false}
              />
            )}
            <AppText
              variant="footnote"
              tone="secondary"
              accessibilityRole="header"
              style={styles.sectionTitle}
            >
              {t('search.citiesTitle')}
            </AppText>
          </View>
        }
        renderItem={({ item }) => (
          <ListItem
            testID={`city-${item.id}`}
            icon="city-variant-outline"
            title={item.name}
            subtitle={item.region}
            onPress={() => goToCity(item)}
          />
        )}
        ListFooterComponent={
          <View style={{ gap: theme.space.lg, marginTop: theme.space.xl }}>
            <NativeAdCard testID="search-native-ad" />
            <AdBanner testID="search-ad" />
          </View>
        }
        ListEmptyComponent={
          showAddresses ? undefined : (
            <EmptyState
              icon="map-search-outline"
              tone="neutral"
              title={t('search.noResults', { query })}
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 68,
  },
  sectionTitle: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 8,
  },
});
