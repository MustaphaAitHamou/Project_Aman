/**
 * Jetons de design bruts. Les composants n'utilisent jamais ces valeurs directement :
 * ils passent par le thème sémantique (`useAppTheme`) pour supporter le mode sombre.
 */
export const palette = {
  /** Bleu source de la DA Tamurt Services (Water Finder). */
  source: {
    soft: '#E2F4F9',
    text: '#0A6B88',
    main: '#0B7797',
    pressed: '#0A6C89',
    vif: '#0E9BC0',
    deep: '#0A4F7A',
    darkMain: '#5FCBE6',
    darkPressed: '#57B9D1',
    darkText: '#72D2EA',
    darkSoft: '#0A2C38',
    darkOn: '#04252F',
  },
  /** Neutres chauds communs à la famille Tamurt Services. */
  sand: {
    surface: '#F6F5F2',
    raised: '#FFFFFF',
    sunken: '#EBE9E4',
    line: '#DEDBD4',
    lineStrong: '#8A857C',
    ink: '#1D1B19',
    inkSecondary: '#45413C',
    inkMuted: '#5C5852',
    darkSurface: '#141312',
    darkRaised: '#1F1D1B',
    darkSunken: '#2A2724',
    darkLine: '#35322E',
    darkLineStrong: '#8A847B',
    darkInk: '#F4F1EC',
    darkInkSecondary: '#D2CCC3',
    darkInkMuted: '#B5AFA6',
  },
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

/**
 * Formes « goutte » de la DA : deux coins arrondis en diagonale, deux coins vifs.
 * Coins physiques (l'application n'a que des langues de gauche à droite).
 */
function drop(round: number, sharp: number) {
  return {
    borderTopLeftRadius: round,
    borderTopRightRadius: sharp,
    borderBottomRightRadius: round,
    borderBottomLeftRadius: sharp,
  } as const;
}

export const shape = {
  button: drop(24, 4),
  buttonSmall: drop(20, 4),
  card: drop(26, 6),
  field: drop(16, 4),
  chip: drop(16, 4),
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
    sm: '0px 1px 3px rgba(29, 27, 25, 0.12)',
    md: '0px 4px 14px rgba(29, 27, 25, 0.14)',
    lg: '0px 12px 32px rgba(29, 27, 25, 0.20)',
  },
  dark: {
    sm: '0px 1px 3px rgba(0, 0, 0, 0.45)',
    md: '0px 4px 14px rgba(0, 0, 0, 0.50)',
    lg: '0px 12px 32px rgba(0, 0, 0, 0.60)',
  },
} as const;
