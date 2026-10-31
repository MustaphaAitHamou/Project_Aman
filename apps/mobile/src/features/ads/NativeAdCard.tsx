import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import {
  NativeAd,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
  NativeMediaView,
} from 'react-native-google-mobile-ads';

import { AppText, Card, StatusBadge } from '@/components/ui';
import { adUnitId } from '@/services/ads/ad-units';
import { useAdsStore } from '@/services/ads/ads-store';
import { useAppTheme } from '@/theme';

/**
 * Annonce native insérée dans une liste, avec le badge « Publicité » exigé par le règlement
 * AdMob et un style distinct des points d'eau pour qu'on ne puisse pas les confondre.
 */
export function NativeAdCard({ testID }: { testID?: string }) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const canRequestAds = useAdsStore((state) => state.canRequestAds);
  const personalized = useAdsStore((state) => state.personalized);
  const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);
  const unitId = adUnitId('native');

  useEffect(() => {
    if (!canRequestAds || !unitId) return;
    let cancelled = false;
    let loaded: NativeAd | null = null;
    NativeAd.createForAdRequest(unitId, { requestNonPersonalizedAdsOnly: !personalized })
      .then((ad) => {
        if (cancelled) ad.destroy();
        else {
          loaded = ad;
          setNativeAd(ad);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      loaded?.destroy();
    };
  }, [canRequestAds, personalized, unitId]);

  if (!nativeAd) return null;

  return (
    <Card testID={testID} style={{ backgroundColor: theme.colors.surfaceElevated }}>
      <NativeAdView nativeAd={nativeAd} style={{ gap: theme.space.sm }}>
        <View style={styles.header}>
          <StatusBadge tone="neutral" label={t('ads.label')} />
          {nativeAd.advertiser ? (
            <NativeAsset assetType={NativeAssetType.ADVERTISER}>
              <AppText variant="footnote" tone="muted">
                {nativeAd.advertiser}
              </AppText>
            </NativeAsset>
          ) : null}
        </View>
        <NativeAsset assetType={NativeAssetType.HEADLINE}>
          <AppText variant="headline">{nativeAd.headline}</AppText>
        </NativeAsset>
        <NativeMediaView style={styles.media} resizeMode="cover" />
        <NativeAsset assetType={NativeAssetType.BODY}>
          <AppText variant="subhead" tone="secondary" numberOfLines={2}>
            {nativeAd.body}
          </AppText>
        </NativeAsset>
        <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
          <AppText variant="callout" tone="primary">
            {nativeAd.callToAction}
          </AppText>
        </NativeAsset>
      </NativeAdView>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  media: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
});
