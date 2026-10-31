import type { LngLat } from '@water-finder/core';
import { getLocales } from 'expo-localization';

/** Pays couverts par les données (mêmes codes que les imports OpenStreetMap). */
export const SUPPORTED_COUNTRIES = ['DZ', 'FR', 'BE', 'CH', 'ES', 'IT', 'CA', 'US'] as const;
export type SupportedCountry = (typeof SUPPORTED_COUNTRIES)[number];

export const isSupportedCountry = (value: unknown): value is SupportedCountry =>
  SUPPORTED_COUNTRIES.includes(value as SupportedCountry);

/** Vue d'ensemble de chaque pays, affichée au premier lancement sans position GPS. */
export const COUNTRY_CAMERAS: Record<SupportedCountry, { center: LngLat; zoom: number }> = {
  DZ: { center: [3.0, 34.5], zoom: 5 },
  FR: { center: [2.45, 46.6], zoom: 4.8 },
  BE: { center: [4.47, 50.5], zoom: 6.8 },
  CH: { center: [8.23, 46.8], zoom: 6.8 },
  ES: { center: [-3.7, 40.2], zoom: 5.2 },
  IT: { center: [12.5, 42.5], zoom: 5 },
  CA: { center: [-96.0, 56.0], zoom: 2.8 },
  US: { center: [-98.5, 39.5], zoom: 3.2 },
};

/**
 * Pays réglé sur l'appareil (réglages de langue et région, pas la position GPS).
 * Sert uniquement à choisir des valeurs par défaut : carte initiale, unités, ordre des villes.
 */
export function deviceRegion(): string | null {
  try {
    return getLocales()[0]?.regionCode?.toUpperCase() ?? null;
  } catch {
    return null;
  }
}

export function defaultCamera(region: string | null = deviceRegion()) {
  return COUNTRY_CAMERAS[isSupportedCountry(region) ? region : 'FR'];
}

/** Système de mesure de l'appareil : pieds / miles aux États-Unis notamment. */
export function deviceUsesImperial(): boolean {
  try {
    return getLocales()[0]?.measurementSystem === 'us';
  } catch {
    return false;
  }
}
