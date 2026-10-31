// Mocks des modules natifs indisponibles dans l'environnement de test Node.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

// Les icônes chargent une police via expo-font, indisponible sous Node : rendu neutre en test.
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

// Initialise i18next (langue forcée en français pour des assertions stables).
import i18n from '@/i18n';

beforeAll(async () => {
  await i18n.changeLanguage('fr');
});

// Modules natifs des fonctionnalités communautaires et publicitaires.
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-tracking-transparency', () => ({
  requestTrackingPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'denied' })),
}));

jest.mock('react-native-google-mobile-ads', () => ({
  __esModule: true,
  default: () => ({ initialize: jest.fn(() => Promise.resolve([])) }),
  AdsConsent: {
    gatherConsent: jest.fn(() =>
      Promise.resolve({ canRequestAds: true, privacyOptionsRequirementStatus: 'REQUIRED' }),
    ),
    getUserChoices: jest.fn(() => Promise.resolve({ selectPersonalisedAds: false })),
    showPrivacyOptionsForm: jest.fn(() =>
      Promise.resolve({ canRequestAds: true, privacyOptionsRequirementStatus: 'REQUIRED' }),
    ),
  },
  AdsConsentPrivacyOptionsRequirementStatus: { REQUIRED: 'REQUIRED', NOT_REQUIRED: 'NOT_REQUIRED' },
  BannerAd: () => null,
  BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' },
  NativeAd: { createForAdRequest: jest.fn(() => Promise.reject(new Error('no fill'))) },
  NativeAdView: () => null,
  NativeAsset: () => null,
  NativeMediaView: () => null,
  NativeAssetType: {},
}));
