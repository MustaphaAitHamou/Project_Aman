import { useTranslation } from 'react-i18next';

import { ComingSoonScreen } from '@/components/ComingSoonScreen';

export default function ContributionsScreen() {
  const { t } = useTranslation();
  return (
    <ComingSoonScreen
      testID="contributions-screen"
      icon="format-list-bulleted"
      title={t('contributions.emptyTitle')}
      body={t('contributions.emptyBody')}
    />
  );
}
