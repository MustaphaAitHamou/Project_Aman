import { getLocales, useLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { useEffect } from 'react';
import { initReactI18next } from 'react-i18next';

import type { LanguagePreference } from '@/stores/preferences';
import { usePreferencesStore } from '@/stores/preferences';

import { en } from './locales/en';
import { fr } from './locales/fr';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from './types';

export { SUPPORTED_LANGUAGES, type SupportedLanguage } from './types';

/** Langue utilisée quand la langue de l'appareil n'est pas prise en charge. */
export const FALLBACK_LANGUAGE: SupportedLanguage = 'en';

function isSupported(code: string): code is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(code);
}

/**
 * Choix explicite de l'utilisateur, sinon première langue prise en charge de l'appareil,
 * sinon l'anglais (utilisateurs internationaux, dont les touristes en France).
 */
export function resolveLanguage(
  preference: LanguagePreference,
  deviceLanguageCodes: readonly (string | null | undefined)[],
): SupportedLanguage {
  if (preference !== 'system') return preference;
  for (const code of deviceLanguageCodes) {
    const base = code?.toLowerCase().split(/[-_]/)[0];
    if (base && isSupported(base)) return base;
  }
  return FALLBACK_LANGUAGE;
}

function deviceLanguageCodes(): string[] {
  try {
    return getLocales().map((locale) => locale.languageCode ?? locale.languageTag);
  } catch {
    return [];
  }
}

/** Instance dédiée à l'application (initialisation synchrone : ressources embarquées). */
const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en } },
  lng: resolveLanguage('system', deviceLanguageCodes()),
  fallbackLng: 'fr',
  supportedLngs: [...SUPPORTED_LANGUAGES],
  interpolation: { escapeValue: false },
  returnNull: false,
  initAsync: false,
});

/** Applique la préférence de langue (et ses changements) à i18next. */
export function useLanguageSync(): void {
  const preference = usePreferencesStore((state) => state.languagePreference);
  const locales = useLocales();
  const language = resolveLanguage(
    preference,
    locales.map((locale) => locale.languageCode ?? locale.languageTag),
  );

  useEffect(() => {
    if (i18n.language !== language) void i18n.changeLanguage(language);
  }, [language]);
}

export default i18n;
