import { useTranslation } from 'react-i18next';
import { Linking, Platform } from 'react-native';

import { AppText, Button, Card, Icon, Screen, type IconName } from '@/components/ui';
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
