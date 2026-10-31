import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Banner, Button, Screen, TextField } from '@/components/ui';
import { errorMessage } from '@/features/auth/auth-errors';
import { isValidEmail, requestPasswordReset, signIn } from '@/services/auth/auth-service';
import { useSessionStore } from '@/services/auth/session';

export default function SignInScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const unavailable = useSessionStore((state) => state.status === 'unavailable');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setInfo(null);
    if (!isValidEmail(email)) return setError(t('auth.errors.invalid_email'));
    if (!password) return setError(t('auth.passwordRequired'));
    setBusy(true);
    try {
      await signIn(email, password);
      if (router.canGoBack()) router.back();
      else router.replace('/profile');
    } catch (e) {
      setError(errorMessage(e, t));
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    setError(null);
    setInfo(null);
    if (!isValidEmail(email)) return setError(t('auth.resetNeedsEmail'));
    setBusy(true);
    try {
      await requestPasswordReset(email);
      setInfo(t('auth.resetSent'));
    } catch (e) {
      setError(errorMessage(e, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen safeTop={false} testID="sign-in-screen">
      {unavailable ? (
        <Banner tone="warning" icon="cloud-off-outline" message={t('auth.unavailableBody')} />
      ) : null}
      <TextField
        testID="sign-in-email"
        label={t('auth.email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <TextField
        testID="sign-in-password"
        label={t('auth.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        onSubmitEditing={() => void submit()}
      />
      {error ? <Banner tone="error" icon="alert-circle-outline" message={error} /> : null}
      {info ? <Banner tone="success" icon="email-check-outline" message={info} /> : null}
      <Button
        testID="sign-in-submit"
        label={t('profile.signIn')}
        icon="login"
        size="lg"
        loading={busy}
        disabled={unavailable}
        onPress={() => void submit()}
      />
      <Button
        label={t('auth.forgotPassword')}
        variant="ghost"
        disabled={busy || unavailable}
        onPress={() => void forgot()}
      />
      <Button
        label={t('auth.noAccount')}
        variant="secondary"
        onPress={() => router.replace('/sign-up')}
      />
    </Screen>
  );
}
