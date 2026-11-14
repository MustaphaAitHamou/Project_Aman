import type { TextStyle } from 'react-native';

/**
 * Police de la DA : M PLUS Rounded 1c, ronde comme une goutte (sous-ensemble latin embarqué,
 * chargé au démarrage dans app/_layout.tsx). Une famille par graisse : Android ignore
 * `fontWeight` pour une police embarquée.
 * Les tailles respectent le réglage d'accessibilité « taille du texte » de l'utilisateur.
 */
export const fontFamily = {
  regular: 'MPLUSRounded1c-Regular',
  bold: 'MPLUSRounded1c-Bold',
  extraBold: 'MPLUSRounded1c-ExtraBold',
} as const;

export const typography = {
  display: { fontSize: 32, lineHeight: 38, fontFamily: fontFamily.extraBold, letterSpacing: -0.4 },
  title1: { fontSize: 28, lineHeight: 34, fontFamily: fontFamily.extraBold, letterSpacing: -0.3 },
  title2: { fontSize: 22, lineHeight: 28, fontFamily: fontFamily.extraBold, letterSpacing: -0.2 },
  title3: { fontSize: 19, lineHeight: 24, fontFamily: fontFamily.bold },
  headline: { fontSize: 17, lineHeight: 22, fontFamily: fontFamily.bold },
  body: { fontSize: 17, lineHeight: 24, fontFamily: fontFamily.regular },
  callout: { fontSize: 16, lineHeight: 22, fontFamily: fontFamily.regular },
  subhead: { fontSize: 15, lineHeight: 20, fontFamily: fontFamily.regular },
  footnote: { fontSize: 13, lineHeight: 18, fontFamily: fontFamily.regular },
  label: { fontSize: 15, lineHeight: 20, fontFamily: fontFamily.bold },
  caption: { fontSize: 12, lineHeight: 16, fontFamily: fontFamily.bold, letterSpacing: 0.1 },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

/** Limite d'agrandissement pour les éléments contraints (barre d'onglets, badges). */
export const MAX_FONT_SCALE_COMPACT = 1.35;
