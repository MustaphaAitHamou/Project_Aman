import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/ui';
import { useAppTheme } from '@/theme';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <EmptyState
        icon="map-marker-off-outline"
        tone="neutral"
        title={t('notFound.title')}
        body={t('notFound.body')}
        action={{
          label: t('notFound.backToMap'),
          icon: 'map-outline',
          onPress: () => router.replace('/'),
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    justifyContent: 'center',
  },
});
