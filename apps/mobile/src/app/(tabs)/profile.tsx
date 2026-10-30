import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Icon, ListItem, Screen, Section } from '@/components/ui';
import { env } from '@/config/env';
import { useAppTheme } from '@/theme';

export default function ProfileTab() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();

  return (
    <Screen title={t('profile.title')} testID="profile-screen">
      <Card style={{ gap: theme.space.md }}>
        <View style={[styles.guest, { gap: theme.space.md }]}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primarySoft }]}>
            <Icon name="account-circle-outline" size={36} color={theme.colors.onPrimarySoft} />
          </View>
          <View style={styles.guestText}>
            <AppText variant="headline">{t('profile.guest')}</AppText>
            <AppText variant="subhead" tone="secondary">
              {t('profile.guestBody')}
            </AppText>
          </View>
        </View>
        <View style={[styles.buttons, { gap: theme.space.sm }]}>
          <Button
            label={t('profile.signIn')}
            icon="login"
            onPress={() => router.push('/sign-in')}
            style={styles.button}
            testID="profile-sign-in"
          />
          <Button
            label={t('profile.signUp')}
            variant="secondary"
            onPress={() => router.push('/sign-up')}
            style={styles.button}
            testID="profile-sign-up"
          />
        </View>
      </Card>

      <Section title={t('profile.sectionAccount')}>
        <ListItem
          icon="heart-outline"
          title={t('profile.favorites')}
          onPress={() => router.push('/favorites')}
        />
        <ListItem
          icon="format-list-bulleted"
          title={t('profile.contributions')}
          onPress={() => router.push('/contributions')}
        />
      </Section>

      <Section title={t('profile.sectionApp')}>
        <ListItem
          testID="profile-settings"
          icon="cog-outline"
          title={t('profile.settings')}
          onPress={() => router.push('/settings')}
        />
        <ListItem
          icon="shield-lock-outline"
          title={t('profile.privacy')}
          onPress={() => router.push('/privacy')}
        />
        <ListItem
          testID="profile-sources"
          icon="database-outline"
          title={t('profile.sources')}
          onPress={() => router.push('/sources')}
        />
      </Section>

      <AppText variant="footnote" tone="muted" align="center">
        {t('profile.version', { version: env.appVersion, env: env.appEnv })}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  guest: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestText: {
    flex: 1,
    gap: 2,
  },
  buttons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  button: {
    flexGrow: 1,
  },
});
