import type { DistanceUnit } from '@water-finder/core';
import { useTranslation } from 'react-i18next';
import { Linking, Platform, View } from 'react-native';

import { ListItem, Screen, Section, SegmentedControl } from '@/components/ui';
import { useLocationStore } from '@/stores/location';
import {
  usePreferencesStore,
  type LanguagePreference,
  type ThemePreference,
} from '@/stores/preferences';
import { useAppTheme } from '@/theme';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const themePreference = usePreferencesStore((state) => state.themePreference);
  const languagePreference = usePreferencesStore((state) => state.languagePreference);
  const distanceUnit = usePreferencesStore((state) => state.distanceUnit);
  const setThemePreference = usePreferencesStore((state) => state.setThemePreference);
  const setLanguagePreference = usePreferencesStore((state) => state.setLanguagePreference);
  const setDistanceUnit = usePreferencesStore((state) => state.setDistanceUnit);
  const resetOnboarding = usePreferencesStore((state) => state.resetOnboarding);
  const permission = useLocationStore((state) => state.permission);

  const themeOptions: { value: ThemePreference; label: string }[] = [
    { value: 'system', label: t('settings.themeSystem') },
    { value: 'light', label: t('settings.themeLight') },
    { value: 'dark', label: t('settings.themeDark') },
  ];
  const languageOptions: { value: LanguagePreference; label: string }[] = [
    { value: 'system', label: t('settings.languageSystem') },
    { value: 'fr', label: t('settings.languageFr') },
    { value: 'en', label: t('settings.languageEn') },
  ];
  const unitOptions: { value: DistanceUnit; label: string }[] = [
    { value: 'metric', label: t('settings.unitsMetric') },
    { value: 'imperial', label: t('settings.unitsImperial') },
  ];
  const permissionLabel =
    permission === 'granted'
      ? t('settings.permissionGranted')
      : permission === 'denied'
        ? t('settings.permissionDenied')
        : t('settings.permissionUndetermined');

  const padded = { padding: theme.space.md };

  return (
    <Screen safeTop={false} testID="settings-screen">
      <Section title={t('settings.appearance')}>
        <View style={padded}>
          <SegmentedControl
            testID="settings-theme"
            accessibilityLabel={t('settings.appearance')}
            options={themeOptions}
            value={themePreference}
            onChange={setThemePreference}
          />
        </View>
      </Section>

      <Section title={t('settings.language')}>
        <View style={padded}>
          <SegmentedControl
            testID="settings-language"
            accessibilityLabel={t('settings.language')}
            options={languageOptions}
            value={languagePreference}
            onChange={setLanguagePreference}
          />
        </View>
      </Section>

      <Section title={t('settings.units')}>
        <View style={padded}>
          <SegmentedControl
            testID="settings-units"
            accessibilityLabel={t('settings.units')}
            options={unitOptions}
            value={distanceUnit}
            onChange={setDistanceUnit}
          />
        </View>
      </Section>

      <Section title={t('settings.permissions')}>
        <ListItem
          icon="crosshairs-gps"
          title={t('settings.locationPermission')}
          value={permissionLabel}
          showChevron={false}
        />
        {Platform.OS !== 'web' ? (
          <ListItem
            icon="open-in-new"
            title={t('settings.manageInSettings')}
            onPress={() => void Linking.openSettings()}
          />
        ) : null}
      </Section>

      <Section>
        <ListItem
          testID="settings-replay-onboarding"
          icon="hand-wave-outline"
          title={t('settings.replayOnboarding')}
          onPress={resetOnboarding}
        />
      </Section>
    </Screen>
  );
}
