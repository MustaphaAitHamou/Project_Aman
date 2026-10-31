import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import {
  EmptyState,
  ListItem,
  LoadingState,
  Screen,
  Section,
  type IconName,
} from '@/components/ui';
import { AuthGate } from '@/features/auth/AuthGate';
import { formatRelativeDate } from '@/lib/format';
import type { AppNotification } from '@/services/community/api';
import { useMarkNotificationsRead, useNotifications } from '@/services/community/hooks';
import { useAppTheme } from '@/theme';

const KNOWN = [
  'contribution_approved',
  'contribution_rejected',
  'report_approved',
  'report_rejected',
  'revision_approved',
  'revision_rejected',
  'photo_approved',
  'photo_rejected',
] as const;
type KnownType = (typeof KNOWN)[number];

export default function ActivityTab() {
  const { t } = useTranslation();
  return (
    <Screen title={t('activity.title')} testID="activity-screen">
      <AuthGate icon="bell-outline" reason={t('activity.authBody')}>
        <NotificationList />
      </AuthGate>
    </Screen>
  );
}

function NotificationList() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const query = useNotifications();
  const markRead = useMarkNotificationsRead();
  const hasUnread = !!query.data?.some((n) => !n.readAt);

  // Les notifications affichées sont marquées comme lues (une seule requête).
  useEffect(() => {
    if (hasUnread && !markRead.isPending) markRead.mutate();
  }, [hasUnread, markRead]);

  if (query.isPending) return <LoadingState label={t('common.loading')} />;
  if (query.isError) {
    return (
      <EmptyState
        icon="alert-circle-outline"
        tone="error"
        title={t('errors.loadFailed')}
        action={{ label: t('common.retry'), icon: 'refresh', onPress: () => void query.refetch() }}
      />
    );
  }
  if (query.data.length === 0) {
    return (
      <EmptyState
        icon="bell-outline"
        title={t('activity.emptyTitle')}
        body={t('activity.emptyBody')}
      />
    );
  }

  const describe = (n: AppNotification): { title: string; icon: IconName; color: string } => {
    const type = KNOWN.find((k) => k === n.type) as KnownType | undefined;
    const approved = n.type.endsWith('_approved');
    return {
      title: type ? t(`activity.type.${type}`) : t('activity.type.other'),
      icon: approved ? 'check-circle-outline' : 'close-circle-outline',
      color: approved ? theme.colors.success.base : theme.colors.error.base,
    };
  };

  return (
    <Section>
      {query.data.map((n) => {
        const { title, icon, color } = describe(n);
        const pointId =
          typeof n.payload.water_point_id === 'string' ? n.payload.water_point_id : null;
        const reason =
          typeof n.payload.reason === 'string' && n.payload.reason ? n.payload.reason : null;
        return (
          <ListItem
            key={n.id}
            icon={icon}
            iconColor={color}
            title={title}
            subtitle={[reason, formatRelativeDate(n.createdAt, t)].filter(Boolean).join(' · ')}
            onPress={
              pointId && n.type.endsWith('_approved')
                ? () => router.push({ pathname: '/point/[id]', params: { id: pointId } })
                : undefined
            }
          />
        );
      })}
    </Section>
  );
}
