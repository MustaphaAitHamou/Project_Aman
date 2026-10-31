import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import {
  EmptyState,
  ListItem,
  LoadingState,
  Screen,
  Section,
  StatusBadge,
  type IconName,
  type StatusTone,
} from '@/components/ui';
import { AuthGate } from '@/features/auth/AuthGate';
import { formatRelativeDate } from '@/lib/format';
import type { Contribution } from '@/services/community/api';
import { useMyContributions } from '@/services/community/hooks';

const ICONS: Record<Contribution['kind'], IconName> = {
  water_point: 'map-marker-plus-outline',
  report: 'flag-outline',
  revision: 'pencil-outline',
  photo: 'camera-outline',
};

/** Statut de modération → ton et clé de texte. */
export function contributionStatus(status: string): {
  tone: StatusTone;
  key: 'pending' | 'approved' | 'rejected' | 'merged';
} {
  if (status === 'approved' || status === 'published') return { tone: 'success', key: 'approved' };
  if (status === 'rejected') return { tone: 'error', key: 'rejected' };
  if (status === 'merged') return { tone: 'neutral', key: 'merged' };
  return { tone: 'warning', key: 'pending' };
}

export default function ContributionsScreen() {
  const { t } = useTranslation();
  return (
    <AuthGate icon="format-list-bulleted" reason={t('contributions.authBody')}>
      <ContributionList />
    </AuthGate>
  );
}

function ContributionList() {
  const { t } = useTranslation();
  const router = useRouter();
  const query = useMyContributions();

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
        icon="format-list-bulleted"
        title={t('contributions.emptyTitle')}
        body={t('contributions.emptyBody')}
      />
    );
  }

  const label = (c: Contribution) => {
    if (c.kind === 'report') {
      const known = [
        'broken',
        'fixed',
        'not_existing',
        'potability_potable',
        'potability_not_potable',
        'other',
      ] as const;
      const type = known.find((k) => k === c.label);
      return type ? t(`report.type.${type}`) : c.label;
    }
    if (c.kind === 'water_point') return c.label;
    return t(`contributions.kind.${c.kind}`);
  };

  return (
    <Screen safeTop={false} testID="contributions-screen">
      <Section footer={t('contributions.footer')}>
        {query.data.map((c) => {
          const status = contributionStatus(c.status);
          return (
            <ListItem
              key={`${c.kind}-${c.id}`}
              icon={ICONS[c.kind]}
              title={label(c)}
              subtitle={[t(`contributions.kind.${c.kind}`), formatRelativeDate(c.createdAt, t)]
                .filter(Boolean)
                .join(' · ')}
              trailing={
                <StatusBadge tone={status.tone} label={t(`contributions.status.${status.key}`)} />
              }
              showChevron={false}
              onPress={
                c.waterPointId && status.key !== 'rejected'
                  ? () =>
                      router.push({
                        pathname: '/point/[id]',
                        params: { id: c.waterPointId as string },
                      })
                  : undefined
              }
            />
          );
        })}
      </Section>
    </Screen>
  );
}
