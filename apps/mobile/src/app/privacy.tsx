import { useTranslation } from 'react-i18next';
import { Linking, Platform } from 'react-native';

import { useState } from 'react';

import { AppText, Banner, Button, Card, Icon, Screen, type IconName } from '@/components/ui';
import { env } from '@/config/env';
import { useAdsStore } from '@/services/ads/ads-store';
import { showPrivacyOptions } from '@/services/ads/consent';
import { useAppTheme } from '@/theme';

type PrivacySection = 'location' | 'account' | 'ads' | 'storage';

const SECTIONS: { key: PrivacySection; icon: IconName }[] = [
  { key: 'location', icon: 'crosshairs-gps' },
  { key: 'account', icon: 'account-circle-outline' },
  { key: 'ads', icon: 'shield-check-outline' },
  { key: 'storage', icon: 'cellphone-marker' },
];

export default function PrivacyScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const ads = useAdsStore();
  const [adsError, setAdsError] = useState(false);

  const manageAds = async () => {
    setAdsError(false);
    try {
      await showPrivacyOptions();
    } catch {
      setAdsError(true);
    }
  };

  return (
    <Screen safeTop={false} testID="privacy-screen">
      <AppText variant="callout" tone="secondary">
        {t('privacy.intro')}
      </AppText>
      {SECTIONS.map(({ key, icon }) => (
        <Card key={key} style={{ gap: theme.space.sm }}>
          <Icon name={icon} size={24} color={theme.colors.primary} />
          <AppText variant="headline" accessibilityRole="header">
            {t(`privacy.${key}Title`)}
          </AppText>
          <AppText variant="callout" tone="secondary">
            {t(`privacy.${key}Body`)}
          </AppText>
        </Card>
      ))}
      {Platform.OS !== 'web' && env.adsEnabled ? (
        <Card style={{ gap: theme.space.sm }} testID="privacy-ads-status">
          <AppText variant="headline">{t('privacy.adsStatusTitle')}</AppText>
          <AppText variant="callout" tone="secondary">
            {!ads.canRequestAds
              ? t('privacy.adsStatusNone')
              : ads.personalized
                ? t('privacy.adsStatusPersonalized')
                : t('privacy.adsStatusNonPersonalized')}
          </AppText>
          <Button
            testID="privacy-manage-ads"
            label={t('privacy.manageAds')}
            icon="tune-variant"
            variant="secondary"
            onPress={() => void manageAds()}
          />
          {adsError ? (
            <Banner
              tone="error"
              icon="alert-circle-outline"
              message={t('privacy.manageAdsError')}
            />
          ) : null}
        </Card>
      ) : null}
      {Platform.OS !== 'web' ? (
        <Button
          label={t('privacy.managePermissions')}
          variant="secondary"
          icon="open-in-new"
          onPress={() => void Linking.openSettings()}
        />
      ) : null}
    </Screen>
  );
}
