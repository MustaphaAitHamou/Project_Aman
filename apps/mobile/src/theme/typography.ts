import type { TextStyle } from 'react-native';

/**
 * Échelle typographique (polices système : SF Pro sur iOS, Roboto sur Android).
 * Les tailles respectent le réglage d'accessibilité « taille du texte » de l'utilisateur.
 */
export const typography = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -0.4 },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.3 },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.2 },
  title3: { fontSize: 19, lineHeight: 24, fontWeight: '600' },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 24, fontWeight: '400' },
  callout: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  label: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.1 },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

/** Limite d'agrandissement pour les éléments contraints (barre d'onglets, badges). */
export const MAX_FONT_SCALE_COMPACT = 1.35;
