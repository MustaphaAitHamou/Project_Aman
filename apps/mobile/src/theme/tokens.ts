/**
 * Jetons de design bruts. Les composants n'utilisent jamais ces valeurs directement :
 * ils passent par le thème sémantique (`useAppTheme`) pour supporter le mode sombre.
 */
export const palette = {
  water: {
    50: '#EEF8FF',
    100: '#E3F2FF',
    200: '#B6E0FF',
    300: '#7CC8FC',
    400: '#4DB8FF',
    500: '#1494E3',
    600: '#0075C4',
    700: '#005EA0',
    800: '#054F84',
    900: '#0A426D',
    950: '#04213A',
  },
  slate: {
    0: '#FFFFFF',
    50: '#F7F9FC',
    100: '#F2F5F9',
    150: '#EEF2F6',
    200: '#E2E8F0',
    300: '#C4CDD8',
    400: '#8D9AAE',
    500: '#7A8699',
    600: '#5F6B7D',
    700: '#4A5668',
    800: '#364152',
    850: '#1E293B',
    900: '#131C2E',
    925: '#0F1A2A',
    950: '#0B1220',
  },
  green: {
    100: '#DCFCE7',
    300: '#86EFAC',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    950: '#0E2A1C',
  },
  orange: { 100: '#FFEDD5', 300: '#FDBA74', 600: '#EA580C', 800: '#9A3412', 950: '#33200E' },
  red: {
    100: '#FEE2E2',
    300: '#FCA5A5',
    400: '#F87171',
    700: '#C62828',
    800: '#991B1B',
    950: '#3A1515',
  },
  rose: { 700: '#BE123C' },
} as const;

export const space = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/** Taille minimale d'une cible tactile (recommandations Android 48 dp / iOS 44 pt). */
export const MIN_TOUCH_TARGET = 48;

export const duration = {
  fast: 150,
  normal: 250,
  slow: 350,
} as const;

/** Ombres portées multiplateformes (propriété `boxShadow`, New Architecture et web). */
export const shadow = {
  light: {
    sm: '0px 1px 3px rgba(15, 26, 42, 0.12)',
    md: '0px 4px 14px rgba(15, 26, 42, 0.14)',
    lg: '0px 12px 32px rgba(15, 26, 42, 0.20)',
  },
  dark: {
    sm: '0px 1px 3px rgba(0, 0, 0, 0.45)',
    md: '0px 4px 14px rgba(0, 0, 0, 0.50)',
    lg: '0px 12px 32px rgba(0, 0, 0, 0.60)',
  },
} as const;
