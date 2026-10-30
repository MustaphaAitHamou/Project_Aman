import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Banner, ListItem, Screen, Section, type IconName } from '@/components/ui';

type ContributionKey =
  'addPoint' | 'reportBroken' | 'reportFixed' | 'addPhoto' | 'suggestEdit' | 'reportMissing';

const CONTRIBUTIONS: { key: ContributionKey; icon: IconName }[] = [
  { key: 'addPoint', icon: 'map-marker-plus' },
  { key: 'reportBroken', icon: 'wrench-outline' },
  { key: 'reportFixed', icon: 'check-circle-outline' },
  { key: 'addPhoto', icon: 'camera-outline' },
  { key: 'suggestEdit', icon: 'pencil-outline' },
  { key: 'reportMissing', icon: 'map-marker-off-outline' },
];

/** Onglet « Ajouter » : toutes les contributions exigent un compte (phase 5). */
export default function AddTab() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Screen title={t('add.title')} subtitle={t('add.subtitle')} testID="add-screen">
      <Banner tone="info" icon="account-group-outline" message={t('add.authNotice')} live={false} />
      <Section>
        {CONTRIBUTIONS.map(({ key, icon }) => (
          <ListItem
            key={key}
            testID={`contribute-${key}`}
            icon={icon}
            title={t(`add.${key}`)}
            subtitle={t(`add.${key}Body`)}
            onPress={() => router.push('/sign-in')}
          />
        ))}
      </Section>
    </Screen>
  );
}
