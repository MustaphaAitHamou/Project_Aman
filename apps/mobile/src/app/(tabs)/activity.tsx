import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EmptyState, Screen } from '@/components/ui';

export default function ActivityTab() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Screen title={t('activity.title')} testID="activity-screen">
      <EmptyState
        icon="bell-outline"
        title={t('activity.emptyTitle')}
        body={t('activity.emptyBody')}
        action={{
          label: t('profile.signIn'),
          icon: 'login',
          onPress: () => router.push('/sign-in'),
        }}
      />
    </Screen>
  );
}
