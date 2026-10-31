import Constants from 'expo-constants';

/**
 * Configuration publique de l'application, figée à la compilation.
 * Les variables `EXPO_PUBLIC_*` sont intégrées au bundle : elles ne doivent jamais contenir de secret.
 */

export type AppEnv = 'development' | 'staging' | 'production';

/**
 * Style vectoriel par défaut : OpenFreeMap (données OpenStreetMap, sans clé d'API).
 * Conditions d'utilisation à confirmer avant la production — voir DATA_SOURCES.md.
 */
export const DEFAULT_MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
/** Police des étiquettes de groupes : doit exister sur le serveur de glyphes du style. */
export const DEFAULT_MAP_FONT = 'Noto Sans Bold';
/**
 * Service de géocodage de la Géoplateforme (IGN), successeur de l'API Adresse.
 * Format de réponse GeoJSON à revérifier sur la documentation officielle avant la production.
 */
export const DEFAULT_GEOCODING_URL = 'https://data.geopf.fr/geocodage/search';
/**
 * Géocodage hors de France : instance publique de Photon (komoot), usage modéré toléré.
 * Pour la production : instance dédiée ou offre commerciale (voir DATA_SOURCES.md).
 */
export const DEFAULT_GEOCODING_INTL_URL = 'https://photon.komoot.io/api';

function readAppEnv(): AppEnv {
  const value: unknown = Constants.expoConfig?.extra?.appEnv;
  return value === 'staging' || value === 'production' ? value : 'development';
}

const appEnv = readAppEnv();

export const env = {
  appEnv,
  appVersion: Constants.expoConfig?.version ?? '0.0.0',
  mapStyleUrl: process.env.EXPO_PUBLIC_MAP_STYLE_URL || DEFAULT_MAP_STYLE_URL,
  mapStyleUrlDark: process.env.EXPO_PUBLIC_MAP_STYLE_URL_DARK || null,
  mapFont: process.env.EXPO_PUBLIC_MAP_FONT || DEFAULT_MAP_FONT,
  /** Données fictives de démonstration : jamais en production (double garde avec app.config.ts). */
  demoData: process.env.EXPO_PUBLIC_DEMO_DATA === 'true' && appEnv !== 'production',
  /** Projet Supabase : URL et clé publique (anon). La sécurité repose sur les règles RLS. */
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || null,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || null,
  /** Géocodage d'adresses (Géoplateforme IGN / Base Adresse Nationale). */
  geocodingUrl: process.env.EXPO_PUBLIC_GEOCODING_URL || DEFAULT_GEOCODING_URL,
  /** Géocodage international (Photon, données OpenStreetMap). */
  geocodingIntlUrl: process.env.EXPO_PUBLIC_GEOCODING_INTL_URL || DEFAULT_GEOCODING_INTL_URL,
  /** Publicités : désactivables globalement (ex. tests, captures pour les stores). */
  adsEnabled: process.env.EXPO_PUBLIC_ADS_ENABLED !== 'false',
} as const;

export function isSupabaseConfigured(): boolean {
  return !!env.supabaseUrl && !!env.supabaseAnonKey;
}
