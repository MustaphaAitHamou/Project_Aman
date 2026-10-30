import { useTranslation } from 'react-i18next';

import { ComingSoonScreen } from '@/components/ComingSoonScreen';

export default function SignInScreen() {
  const { t } = useTranslation();
  return (
    <ComingSoonScreen
      testID="sign-in-screen"
      icon="login"
      title={t('auth.signInTitle')}
      body={t('auth.comingSoonBody')}
    />
  );
}
