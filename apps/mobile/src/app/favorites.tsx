import { useTranslation } from 'react-i18next';

import { ComingSoonScreen } from '@/components/ComingSoonScreen';

export default function FavoritesScreen() {
  const { t } = useTranslation();
  return (
    <ComingSoonScreen
      testID="favorites-screen"
      icon="heart-outline"
      title={t('favorites.emptyTitle')}
      body={t('favorites.emptyBody')}
    />
  );
}
