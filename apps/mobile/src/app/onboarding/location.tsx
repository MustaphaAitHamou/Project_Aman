import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Banner, Button, Icon } from '@/components/ui';
import { useLocationStore } from '@/stores/location';
import { usePreferencesStore } from '@/stores/preferences';
import { useAppTheme } from '@/theme';

const PROMISES = ['locationPromise1', 'locationPromise2', 'locationPromise3'] as const;

/**
 * Demande d'autorisation de localisation, expliquée avant le dialogue système.
 * Refuser n'empêche pas d'utiliser l'application (recherche manuelle d'une ville).
 */
export default function LocationPermissionScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const completeOnboarding = usePreferencesStore((state) => state.completeOnboarding);
  const permission = useLocationStore((state) => state.permission);
  const canAskAgain = useLocationStore((state) => state.canAskAgain);
  const requestPermission = useLocationStore((state) => state.requestPermission);
  const [requesting, setRequesting] = useState(false);
  const blocked = permission === 'denied' && !canAskAgain;

  const allow = async () => {
    setRequesting(true);
    try {
      await requestPermission();
    } finally {
      setRequesting(false);
      // Quelle que soit la réponse, l'utilisateur accède à l'application.
      completeOnboarding();
    }
  };

  return (
    <View
      testID="onboarding-location-screen"
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingTop: insets.top + theme.space['3xl'],
          paddingBottom: insets.bottom + theme.space.lg,
          paddingHorizontal: theme.space['2xl'],
          gap: theme.space['2xl'],
        },
      ]}
    >
      <View style={[styles.content, { gap: theme.space.xl }]}>
        <View style={[styles.iconCircle, { backgroundColor: theme.colors.primarySoft }]}>
          <Icon name="crosshairs-gps" size={56} color={theme.colors.primary} />
        </View>
        <View style={{ gap: theme.space.md }}>
          <AppText variant="title1" align="center" accessibilityRole="header">
            {t('onboarding.locationTitle')}
          </AppText>
          <AppText variant="body" tone="secondary" align="center">
            {t('onboarding.locationBody')}
          </AppText>
        </View>
        <View style={{ gap: theme.space.md, alignSelf: 'stretch' }}>
          {PROMISES.map((key) => (
            <View key={key} style={[styles.promise, { gap: theme.space.md }]}>
              <Icon name="check-circle-outline" size={24} color={theme.colors.success.base} />
              <AppText variant="callout" style={styles.flex}>
                {t(`onboarding.${key}`)}
              </AppText>
            </View>
          ))}
        </View>
        {blocked ? <Banner tone="warning" message={t('onboarding.locationBlocked')} /> : null}
      </View>

      <View style={{ gap: theme.space.sm }}>
        {blocked && Platform.OS !== 'web' ? (
          <Button
            size="lg"
            label={t('common.openSettings')}
            icon="open-in-new"
            onPress={() => void Linking.openSettings()}
          />
        ) : (
          <Button
            testID="onboarding-allow-location"
            size="lg"
            icon="crosshairs-gps"
            label={t('onboarding.locationAllow')}
            loading={requesting}
            onPress={() => void allow()}
          />
        )}
        <Button
          testID="onboarding-not-now"
          size="lg"
          variant="ghost"
          label={blocked ? t('common.continue') : t('onboarding.locationNotNow')}
          onPress={completeOnboarding}
        />
        <AppText variant="footnote" tone="muted" align="center">
          {t('onboarding.locationManualHint')}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promise: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flex: {
    flex: 1,
  },
});
