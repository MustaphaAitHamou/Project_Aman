import { useTranslation } from 'react-i18next';

import { ComingSoonScreen } from '@/components/ComingSoonScreen';

export default function SignUpScreen() {
  const { t } = useTranslation();
  return (
    <ComingSoonScreen
      testID="sign-up-screen"
      icon="account-plus-outline"
      title={t('auth.signUpTitle')}
      body={t('auth.comingSoonBody')}
    />
  );
}
