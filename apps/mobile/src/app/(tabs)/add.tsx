import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Banner, Button, ListItem, Screen, Section, type IconName } from '@/components/ui';
import { useSessionStore } from '@/services/auth/session';

type PointAction = 'reportBroken' | 'reportFixed' | 'addPhoto' | 'suggestEdit' | 'reportMissing';

const POINT_ACTIONS: { key: PointAction; icon: IconName }[] = [
  { key: 'reportBroken', icon: 'wrench-outline' },
  { key: 'reportFixed', icon: 'check-circle-outline' },
  { key: 'addPhoto', icon: 'camera-outline' },
  { key: 'suggestEdit', icon: 'pencil-outline' },
  { key: 'reportMissing', icon: 'map-marker-off-outline' },
];

/**
 * Onglet « Ajouter » : ajout d'un nouveau point ; les autres contributions portent sur un point
 * existant et se font depuis sa fiche (on renvoie donc vers la carte).
 */
export default function AddTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const signedIn = useSessionStore((state) => state.status === 'signedIn');

  return (
    <Screen title={t('add.title')} subtitle={t('add.subtitle')} testID="add-screen">
      {!signedIn ? (
        <Banner
          tone="info"
          icon="account-group-outline"
          message={t('add.authNotice')}
          live={false}
        />
      ) : null}
      <Button
        testID="contribute-addPoint"
        label={t('add.addPoint')}
        icon="map-marker-plus"
        size="lg"
        onPress={() => router.push('/new-point')}
      />
      <Section title={t('add.onPointTitle')} footer={t('add.onPointFooter')}>
        {POINT_ACTIONS.map(({ key, icon }) => (
          <ListItem
            key={key}
            testID={`contribute-${key}`}
            icon={icon}
            title={t(`add.${key}`)}
            subtitle={t(`add.${key}Body`)}
            onPress={() => router.navigate('/')}
          />
        ))}
      </Section>
    </Screen>
  );
}
