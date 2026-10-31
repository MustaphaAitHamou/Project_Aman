import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/ui';

/** Confirmation commune : la contribution est enregistrée et attend la modération. */
export function SubmittedState({ body }: { body?: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <View style={styles.center}>
      <EmptyState
        testID="contribution-submitted"
        icon="check-circle-outline"
        tone="success"
        title={t('contribute.submittedTitle')}
        body={body ?? t('contribute.submittedBody')}
        action={{
          label: t('common.close'),
          onPress: () => (router.canGoBack() ? router.back() : router.replace('/')),
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
  },
});
