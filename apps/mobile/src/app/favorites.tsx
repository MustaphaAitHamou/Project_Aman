import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EmptyState, ListItem, LoadingState, Screen, Section } from '@/components/ui';
import { AuthGate } from '@/features/auth/AuthGate';
import { KIND_ICONS } from '@/features/water-points/presentation';
import { useFavorites } from '@/services/community/hooks';

export default function FavoritesScreen() {
  const { t } = useTranslation();
  return (
    <AuthGate icon="heart-outline" reason={t('favorites.authBody')}>
      <FavoritesList />
    </AuthGate>
  );
}

function FavoritesList() {
  const { t } = useTranslation();
  const router = useRouter();
  const query = useFavorites();

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
        testID="favorites-empty"
        icon="heart-outline"
        title={t('favorites.emptyTitle')}
        body={t('favorites.emptyBody')}
      />
    );
  }

  return (
    <Screen safeTop={false} testID="favorites-screen">
      <Section>
        {query.data.map((favorite) => (
          <ListItem
            key={favorite.pointId}
            icon={KIND_ICONS[favorite.kind]}
            title={favorite.name ?? t(`point.kind.${favorite.kind}`)}
            subtitle={favorite.city ?? undefined}
            onPress={() =>
              router.push({ pathname: '/point/[id]', params: { id: favorite.pointId } })
            }
          />
        ))}
      </Section>
    </Screen>
  );
}
