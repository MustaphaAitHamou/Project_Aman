import type { fr } from './locales/fr';

type DeepStringify<T> = { [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]> };

/** Forme imposée à toute traduction : mêmes clés que le français, valeurs libres. */
export type Translations = DeepStringify<typeof fr>;

export const SUPPORTED_LANGUAGES = ['fr', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
