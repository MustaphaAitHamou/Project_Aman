import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Configuration Expo dynamique, déclinée par environnement (development / staging / production).
 * Les valeurs proviennent des variables d'environnement (voir `.env.example` à la racine).
 * Aucune clé secrète ne doit être lue ici : tout ce qui est exposé au client est public.
 */

type AppEnv = 'development' | 'staging' | 'production';

const APP_ENV: AppEnv = (() => {
  const value = process.env.APP_ENV ?? 'development';
  if (value === 'development' || value === 'staging' || value === 'production') return value;
  throw new Error(
    `APP_ENV invalide : « ${value} » (attendu : development, staging ou production).`,
  );
})();

const IS_PRODUCTION = APP_ENV === 'production';

if (IS_PRODUCTION && process.env.EXPO_PUBLIC_DEMO_DATA === 'true') {
  throw new Error(
    'Les données de démonstration sont interdites en production (EXPO_PUBLIC_DEMO_DATA).',
  );
}

/**
 * Identifiant de base de l'application. À confirmer avant la première soumission aux stores :
 * il ne pourra plus être modifié après publication.
 */
const BASE_BUNDLE_ID = process.env.APP_BUNDLE_ID ?? 'com.waterfinder.app';

const VARIANTS: Record<AppEnv, { name: string; bundleSuffix: string; scheme: string }> = {
  development: { name: 'Water Finder (Dev)', bundleSuffix: '.dev', scheme: 'waterfinder-dev' },
  staging: {
    name: 'Water Finder (Staging)',
    bundleSuffix: '.staging',
    scheme: 'waterfinder-staging',
  },
  production: { name: 'Water Finder', bundleSuffix: '', scheme: 'waterfinder' },
};

const variant = VARIANTS[APP_ENV];
const bundleIdentifier = `${BASE_BUNDLE_ID}${variant.bundleSuffix}`;

const LOCATION_PERMISSION_FR =
  'Water Finder utilise votre position uniquement lorsque l’application est ouverte, pour afficher les points d’eau autour de vous. Votre position n’est ni enregistrée ni partagée.';

/**
 * AdMob : identifiants d'application (publics). Sans variable, identifiants de démonstration
 * officiels de Google, utilisables uniquement en développement.
 */
const ADMOB_ANDROID_APP_ID =
  process.env.ADMOB_ANDROID_APP_ID ?? 'ca-app-pub-3940256099942544~3347511713';
const ADMOB_IOS_APP_ID = process.env.ADMOB_IOS_APP_ID ?? 'ca-app-pub-3940256099942544~1458002511';

if (IS_PRODUCTION && (!process.env.ADMOB_ANDROID_APP_ID || !process.env.ADMOB_IOS_APP_ID)) {
  // Un build de production avec les identifiants de démonstration ne génère aucun revenu.
  console.warn('ADMOB_ANDROID_APP_ID / ADMOB_IOS_APP_ID absents : identifiants de test utilisés.');
}

const TRACKING_PERMISSION_FR =
  'Votre identifiant publicitaire permet d’afficher des publicités plus pertinentes qui financent Water Finder, gratuit. Vous pouvez refuser : l’application reste entièrement utilisable.';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: variant.name,
  slug: 'water-finder',
  owner: process.env.EXPO_OWNER || undefined,
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: variant.scheme,
  userInterfaceStyle: 'automatic',
  runtimeVersion: { policy: 'appVersion' },
  ios: {
    bundleIdentifier,
    supportsTablet: true,
    config: { usesNonExemptEncryption: false },
    infoPlist: {
      CFBundleAllowMixedLocalizations: true,
    },
  },
  android: {
    package: bundleIdentifier,
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon-foreground.png',
      monochromeImage: './assets/images/adaptive-icon-monochrome.png',
      backgroundColor: '#0075C4',
    },
    predictiveBackGestureEnabled: false,
    // Minimisation : aucune localisation en arrière-plan en V1, aucun accès au stockage partagé.
    // L'affichage par-dessus les autres applications n'est conservé qu'en développement (outils de debug).
    blockedPermissions: [
      'android.permission.ACCESS_BACKGROUND_LOCATION',
      'android.permission.FOREGROUND_SERVICE_LOCATION',
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      ...(IS_PRODUCTION ? ['android.permission.SYSTEM_ALERT_WINDOW'] : []),
    ],
  },
  web: {
    output: 'single',
    favicon: './assets/images/favicon.png',
  },
  locales: {
    fr: './locales/fr.json',
    en: './locales/en.json',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#0075C4',
        image: './assets/images/splash-icon.png',
        imageWidth: 160,
        dark: {
          backgroundColor: '#0B1220',
          image: './assets/images/splash-icon.png',
        },
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission: LOCATION_PERMISSION_FR,
        locationAlwaysAndWhenInUsePermission: false,
        locationAlwaysPermission: false,
        locationFullAccuracyPermission: false,
        motionUsagePermission: false,
        isIosBackgroundLocationEnabled: false,
        isAndroidBackgroundLocationEnabled: false,
        isAndroidForegroundServiceEnabled: false,
      },
    ],
    'expo-localization',
    'expo-web-browser',
    'expo-secure-store',
    '@maplibre/maplibre-react-native',
    [
      'expo-image-picker',
      {
        photosPermission:
          'Water Finder accède aux photos que vous choisissez pour illustrer un point d’eau.',
        cameraPermission:
          'Water Finder utilise l’appareil photo pour photographier un point d’eau.',
        // Aucune vidéo : le micro n'est jamais demandé.
        microphonePermission: false,
      },
    ],
    ['expo-tracking-transparency', { userTrackingPermission: TRACKING_PERMISSION_FR }],
    [
      'react-native-google-mobile-ads',
      {
        androidAppId: ADMOB_ANDROID_APP_ID,
        iosAppId: ADMOB_IOS_APP_ID,
        // Aucune mesure avant le parcours de consentement.
        delayAppMeasurementInit: true,
        userTrackingUsageDescription: TRACKING_PERMISSION_FR,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    appEnv: APP_ENV,
    eas: process.env.EAS_PROJECT_ID ? { projectId: process.env.EAS_PROJECT_ID } : undefined,
  },
});
