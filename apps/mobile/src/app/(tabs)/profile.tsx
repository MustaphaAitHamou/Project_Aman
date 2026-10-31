import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import {
  AppText,
  Banner,
  Button,
  Card,
  Icon,
  ListItem,
  Screen,
  Section,
  StatusBadge,
  TextField,
} from '@/components/ui';
import { env } from '@/config/env';
import { errorMessage } from '@/features/auth/auth-errors';
import { confirmAction } from '@/lib/confirm';
import { deleteAccount, signOut, updateDisplayName } from '@/services/auth/auth-service';
import { useSessionStore } from '@/services/auth/session';
import { useAppTheme } from '@/theme';

export default function ProfileTab() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const status = useSessionStore((state) => state.status);
  const session = useSessionStore((state) => state.session);
  const profile = useSessionStore((state) => state.profile);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signedIn = status === 'signedIn' && !!session;

  const run = async (action: () => Promise<void>) => {
    setError(null);
    setBusy(true);
    try {
      await action();
    } catch (e) {
      setError(errorMessage(e, t));
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = () =>
    run(async () => {
      await signOut();
      queryClient.removeQueries({ queryKey: ['favorites'] });
      queryClient.removeQueries({ queryKey: ['contributions'] });
      queryClient.removeQueries({ queryKey: ['notifications'] });
    });

  const handleDelete = async () => {
    const confirmed = await confirmAction({
      title: t('profile.deleteTitle'),
      message: t('profile.deleteBody'),
      confirmLabel: t('profile.deleteConfirm'),
      cancelLabel: t('common.cancel'),
      destructive: true,
    });
    if (!confirmed) return;
    await run(async () => {
      await deleteAccount();
      queryClient.clear();
    });
  };

  const saveName = () =>
    run(async () => {
      await updateDisplayName(name);
      setEditing(false);
    });

  return (
    <Screen title={t('profile.title')} testID="profile-screen">
      <Card style={{ gap: theme.space.md }}>
        <View style={[styles.guest, { gap: theme.space.md }]}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primarySoft }]}>
            <Icon name="account-circle-outline" size={36} color={theme.colors.onPrimarySoft} />
          </View>
          <View style={styles.guestText}>
            <AppText variant="headline" testID="profile-name">
              {signedIn ? (profile?.displayName ?? t('profile.noDisplayName')) : t('profile.guest')}
            </AppText>
            <AppText variant="subhead" tone="secondary">
              {signedIn ? session.user.email : t('profile.guestBody')}
            </AppText>
            {signedIn && profile && profile.role !== 'user' ? (
              <StatusBadge
                tone="info"
                icon="shield-account-outline"
                label={t(`profile.role.${profile.role}`)}
              />
            ) : null}
          </View>
        </View>
        {status === 'unavailable' ? (
          <Banner
            tone="neutral"
            icon="cloud-off-outline"
            message={t('auth.unavailableBody')}
            live={false}
          />
        ) : signedIn ? (
          editing ? (
            <View style={{ gap: theme.space.sm }}>
              <TextField
                testID="profile-name-input"
                label={t('auth.displayName')}
                hint={t('auth.displayNameHint')}
                value={name}
                onChangeText={setName}
                maxLength={40}
              />
              <View style={[styles.buttons, { gap: theme.space.sm }]}>
                <Button
                  label={t('common.save')}
                  loading={busy}
                  onPress={() => void saveName()}
                  style={styles.button}
                />
                <Button
                  label={t('common.cancel')}
                  variant="secondary"
                  onPress={() => setEditing(false)}
                  style={styles.button}
                />
              </View>
            </View>
          ) : (
            <View style={[styles.buttons, { gap: theme.space.sm }]}>
              <Button
                label={t('profile.editName')}
                icon="pencil-outline"
                variant="secondary"
                onPress={() => {
                  setName(profile?.displayName ?? '');
                  setEditing(true);
                }}
                style={styles.button}
              />
              <Button
                testID="profile-sign-out"
                label={t('profile.signOut')}
                icon="logout"
                variant="secondary"
                loading={busy}
                onPress={() => void handleSignOut()}
                style={styles.button}
              />
            </View>
          )
        ) : (
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
        )}
        {error ? <Banner tone="error" icon="alert-circle-outline" message={error} /> : null}
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

      {signedIn ? (
        <Section title={t('profile.sectionDanger')} footer={t('profile.deleteFooter')}>
          <ListItem
            testID="profile-delete-account"
            icon="account-remove-outline"
            iconColor={theme.colors.danger}
            title={t('profile.deleteAccount')}
            onPress={() => void handleDelete()}
          />
        </Section>
      ) : null}

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
    gap: 4,
    alignItems: 'flex-start',
  },
  buttons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  button: {
    flexGrow: 1,
  },
});
