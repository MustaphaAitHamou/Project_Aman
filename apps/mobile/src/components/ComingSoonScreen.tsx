import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { EmptyState, type IconName } from '@/components/ui';
import { useAppTheme } from '@/theme';

export interface ComingSoonScreenProps {
  icon: IconName;
  title: string;
  body: string;
  testID?: string;
}

/**
 * Écran d'une fonctionnalité prévue dans une phase ultérieure : il explique clairement
 * ce qui arrive et propose toujours un retour, sans faux bouton.
 */
export function ComingSoonScreen({ icon, title, body, testID }: ComingSoonScreenProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]} testID={testID}>
      <EmptyState
        icon={icon}
        title={title}
        body={body}
        action={{
          label: t('auth.backToMap'),
          icon: 'map-outline',
          onPress: () => (router.canGoBack() ? router.back() : router.replace('/')),
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
