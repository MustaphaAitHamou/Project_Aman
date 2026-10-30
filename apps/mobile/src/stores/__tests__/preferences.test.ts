import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_FILTERS } from '@water-finder/core';

import { DEFAULT_PREFERENCES, usePreferencesStore } from '../preferences';

const STORAGE_KEY = 'water-finder.preferences';

beforeEach(async () => {
  await AsyncStorage.clear();
  usePreferencesStore.setState({ ...DEFAULT_PREFERENCES, filters: { ...DEFAULT_FILTERS } });
});

describe('préférences', () => {
  it('persiste uniquement les préférences (aucune donnée de localisation)', async () => {
    usePreferencesStore.getState().setThemePreference('dark');
    usePreferencesStore.getState().updateFilters({ freeOnly: true });
    usePreferencesStore.getState().completeOnboarding();
    // L'écriture est asynchrone.
    await new Promise((resolve) => setTimeout(resolve, 0));

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const saved = JSON.parse(raw ?? '{}') as { state: Record<string, unknown> };
    expect(Object.keys(saved.state).sort()).toEqual(
      [
        'distanceUnit',
        'filters',
        'hasCompletedOnboarding',
        'languagePreference',
        'themePreference',
      ].sort(),
    );
    expect(saved.state).toMatchObject({ themePreference: 'dark', hasCompletedOnboarding: true });
    expect(JSON.stringify(saved)).not.toMatch(/latitude|longitude|position/);
  });

  it('complète un enregistrement ancien avec les nouveaux filtres par défaut', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: { themePreference: 'light', filters: { freeOnly: true } },
        version: 1,
      }),
    );
    await usePreferencesStore.persist.rehydrate();
    const state = usePreferencesStore.getState();
    expect(state.themePreference).toBe('light');
    expect(state.filters).toEqual({ ...DEFAULT_FILTERS, freeOnly: true });
  });

  it('réinitialise les filtres', () => {
    usePreferencesStore.getState().updateFilters({ potability: 'certified', sparklingOnly: true });
    usePreferencesStore.getState().resetFilters();
    expect(usePreferencesStore.getState().filters).toEqual(DEFAULT_FILTERS);
  });
});
