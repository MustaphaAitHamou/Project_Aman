import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppText, Banner, Button, EmptyState, Screen, TextField } from '@/components/ui';
import { errorMessage } from '@/features/auth/auth-errors';
import { isValidEmail, MIN_PASSWORD_LENGTH, signUp } from '@/services/auth/auth-service';
import { useSessionStore } from '@/services/auth/session';

export default function SignUpScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const unavailable = useSessionStore((state) => state.status === 'unavailable');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const submit = async () => {
    setError(null);
    const name = displayName.trim();
    if (name && (name.length < 2 || name.length > 40))
      return setError(t('auth.displayNameInvalid'));
    if (!isValidEmail(email)) return setError(t('auth.errors.invalid_email'));
    if (password.length < MIN_PASSWORD_LENGTH)
      return setError(t('auth.passwordTooShort', { count: MIN_PASSWORD_LENGTH }));
    setBusy(true);
    try {
      const { needsConfirmation } = await signUp(email, password, name);
      if (needsConfirmation) setConfirmationSent(true);
      else if (router.canGoBack()) router.back();
      else router.replace('/profile');
    } catch (e) {
      setError(errorMessage(e, t));
    } finally {
      setBusy(false);
    }
  };

  if (confirmationSent) {
    return (
      <EmptyState
        testID="sign-up-confirmation"
        icon="email-check-outline"
        tone="success"
        title={t('auth.confirmTitle')}
        body={t('auth.confirmBody', { email: email.trim() })}
        action={{
          label: t('profile.signIn'),
          icon: 'login',
          onPress: () => router.replace('/sign-in'),
        }}
      />
    );
  }

  return (
    <Screen safeTop={false} testID="sign-up-screen">
      {unavailable ? (
        <Banner tone="warning" icon="cloud-off-outline" message={t('auth.unavailableBody')} />
      ) : null}
      <TextField
        testID="sign-up-name"
        label={t('auth.displayName')}
        hint={t('auth.displayNameHint')}
        value={displayName}
        onChangeText={setDisplayName}
        autoComplete="nickname"
        maxLength={40}
      />
      <TextField
        testID="sign-up-email"
        label={t('auth.email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <TextField
        testID="sign-up-password"
        label={t('auth.password')}
        hint={t('auth.passwordTooShort', { count: MIN_PASSWORD_LENGTH })}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />
      {error ? <Banner tone="error" icon="alert-circle-outline" message={error} /> : null}
      <AppText variant="footnote" tone="muted">
        {t('auth.signUpNotice')}
      </AppText>
      <Button
        testID="sign-up-submit"
        label={t('profile.signUp')}
        icon="account-plus-outline"
        size="lg"
        loading={busy}
        disabled={unavailable}
        onPress={() => void submit()}
      />
      <Button
        label={t('auth.haveAccount')}
        variant="secondary"
        onPress={() => router.replace('/sign-in')}
      />
    </Screen>
  );
}
