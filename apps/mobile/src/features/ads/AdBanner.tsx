import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { AppText } from '@/components/ui';
import { adUnitId } from '@/services/ads/ad-units';
import { useAdsStore } from '@/services/ads/ads-store';
import { useAppTheme } from '@/theme';

/**
 * Bannière adaptative, toujours signalée comme publicité et placée en fin de contenu :
 * elle ne recouvre jamais la carte, la potabilité ni un formulaire. Rien n'est affiché sans
 * consentement exploitable ou en cas d'échec de chargement.
 */
export function AdBanner({ testID }: { testID?: string }) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const canRequestAds = useAdsStore((state) => state.canRequestAds);
  const personalized = useAdsStore((state) => state.personalized);
  const unitId = adUnitId('banner');
  if (!canRequestAds || !unitId) return null;

  return (
    <View style={[styles.container, { gap: theme.space.xs }]} testID={testID}>
      <AppText variant="caption" tone="muted">
        {t('ads.label')}
      </AppText>
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: !personalized }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});
