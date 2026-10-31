import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { EmptyState, LoadingState, type IconName } from '@/components/ui';
import { useSessionStore } from '@/services/auth/session';

export interface AuthGateProps {
  icon: IconName;
  /** Explication affichée à un visiteur non connecté. */
  reason: string;
  children: ReactNode;
}

/**
 * Affiche son contenu uniquement pour un utilisateur connecté ; sinon explique pourquoi un compte
 * est nécessaire. Si le backend n'est pas configuré, le dit clairement (aucun faux formulaire).
 */
export function AuthGate({ icon, reason, children }: AuthGateProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const status = useSessionStore((state) => state.status);

  if (status === 'signedIn') return children;
  if (status === 'loading') return <LoadingState label={t('common.loading')} />;

  return (
    <View style={styles.center}>
      {status === 'unavailable' ? (
        <EmptyState
          icon="cloud-off-outline"
          tone="neutral"
          title={t('auth.unavailableTitle')}
          body={t('auth.unavailableBody')}
        />
      ) : (
        <EmptyState
          icon={icon}
          title={t('auth.requiredTitle')}
          body={reason}
          action={{
            label: t('profile.signIn'),
            icon: 'login',
            onPress: () => router.push('/sign-in'),
          }}
          secondaryAction={{ label: t('profile.signUp'), onPress: () => router.push('/sign-up') }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
  },
});
