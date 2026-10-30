import { Tabs } from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';

import { AppTabBar } from '@/components/navigation/AppTabBar';
import { useLocationTracking } from '@/services/location/useLocationTracking';

export default function TabsLayout() {
  const { t } = useTranslation();
  // Suivi de position au premier plan uniquement, partagé par tous les onglets.
  useLocationTracking();

  return (
    <Tabs tabBar={(props) => <AppTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: t('tabs.map') }} />
      <Tabs.Screen name="search" options={{ title: t('tabs.search') }} />
      <Tabs.Screen name="add" options={{ title: t('tabs.add') }} />
      <Tabs.Screen name="activity" options={{ title: t('tabs.activity') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}
