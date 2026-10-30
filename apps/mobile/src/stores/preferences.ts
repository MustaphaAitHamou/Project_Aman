import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_FILTERS, type DistanceUnit, type WaterPointFilters } from '@water-finder/core';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemePreference = 'system' | 'light' | 'dark';
export type LanguagePreference = 'system' | 'fr' | 'en';

interface PersistedPreferences {
  hasCompletedOnboarding: boolean;
  themePreference: ThemePreference;
  languagePreference: LanguagePreference;
  distanceUnit: DistanceUnit;
  filters: WaterPointFilters;
}

interface PreferencesActions {
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  setThemePreference: (preference: ThemePreference) => void;
  setLanguagePreference: (preference: LanguagePreference) => void;
  setDistanceUnit: (unit: DistanceUnit) => void;
  updateFilters: (patch: Partial<WaterPointFilters>) => void;
  resetFilters: () => void;
}

export type PreferencesState = PersistedPreferences & PreferencesActions;

export const DEFAULT_PREFERENCES: PersistedPreferences = {
  hasCompletedOnboarding: false,
  themePreference: 'system',
  languagePreference: 'system',
  distanceUnit: 'metric',
  filters: { ...DEFAULT_FILTERS },
};

/**
 * Préférences locales de l'appareil (aucune donnée envoyée à un serveur).
 * Volontairement absents : position, historique de déplacements, dernière zone consultée.
 */
export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...DEFAULT_PREFERENCES,
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      resetOnboarding: () => set({ hasCompletedOnboarding: false }),
      setThemePreference: (themePreference) => set({ themePreference }),
      setLanguagePreference: (languagePreference) => set({ languagePreference }),
      setDistanceUnit: (distanceUnit) => set({ distanceUnit }),
      updateFilters: (patch) => set((state) => ({ filters: { ...state.filters, ...patch } })),
      resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),
    }),
    {
      name: 'water-finder.preferences',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({
        hasCompletedOnboarding,
        themePreference,
        languagePreference,
        distanceUnit,
        filters,
      }): PersistedPreferences => ({
        hasCompletedOnboarding,
        themePreference,
        languagePreference,
        distanceUnit,
        filters,
      }),
      // Fusion tolérante : un nouveau filtre ajouté plus tard reçoit sa valeur par défaut.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<PersistedPreferences>;
        return {
          ...current,
          ...saved,
          filters: { ...DEFAULT_FILTERS, ...saved.filters },
        };
      },
    },
  ),
);

/** Vrai lorsque les préférences ont été relues depuis le stockage local. */
export function usePreferencesHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => usePreferencesStore.persist.onFinishHydration(onChange),
    () => usePreferencesStore.persist.hasHydrated(),
    () => false,
  );
}
