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
