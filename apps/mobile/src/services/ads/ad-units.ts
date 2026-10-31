import { Platform } from 'react-native';

import { env } from '@/config/env';

/**
 * Blocs d'annonces. Hors production, toujours les blocs de test officiels de Google (cliquer sur
 * de vraies annonces en développement est interdit par le règlement AdMob). En production, les
 * identifiants viennent des variables EXPO_PUBLIC_ADMOB_* (publics par nature, pas des secrets) ;
 * sans identifiant, l'emplacement reste vide.
 */
export type AdPlacement = 'banner' | 'native' | 'interstitial';

/** Identifiants de test publiés par Google (documentation AdMob). */
export const GOOGLE_TEST_UNITS: Record<'ios' | 'android', Record<AdPlacement, string>> = {
  ios: {
    banner: 'ca-app-pub-3940256099942544/2435281174',
    native: 'ca-app-pub-3940256099942544/3986624511',
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
  },
  android: {
    banner: 'ca-app-pub-3940256099942544/9214589741',
    native: 'ca-app-pub-3940256099942544/2247696110',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
  },
};

const PRODUCTION_UNITS: Record<'ios' | 'android', Record<AdPlacement, string | undefined>> = {
  ios: {
    banner: process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER,
    native: process.env.EXPO_PUBLIC_ADMOB_IOS_NATIVE,
    interstitial: process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL,
  },
  android: {
    banner: process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER,
    native: process.env.EXPO_PUBLIC_ADMOB_ANDROID_NATIVE,
    interstitial: process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL,
  },
};

/**
 * Interstitiels : préparés mais désactivés (choix produit). Ne jamais les afficher à l'ouverture,
 * pendant un itinéraire ou au milieu d'un signalement.
 */
export const INTERSTITIALS_ENABLED = false;

export function adUnitId(
  placement: AdPlacement,
  options: { os?: string; appEnv?: string } = {},
): string | null {
  const os = options.os ?? Platform.OS;
  if (os !== 'ios' && os !== 'android') return null;
  if ((options.appEnv ?? env.appEnv) !== 'production') return GOOGLE_TEST_UNITS[os][placement];
  return PRODUCTION_UNITS[os][placement] || null;
}
