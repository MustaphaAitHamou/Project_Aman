import { palette } from './tokens';

export type ColorScheme = 'light' | 'dark';

export interface StatusColors {
  /** Couleur d'accent (icônes, bordures). */
  base: string;
  /** Fond doux d'un badge. */
  soft: string;
  /** Texte lisible sur `soft` (contraste AA vérifié par test). */
  onSoft: string;
}

/** Couleurs des couches de la carte (partagées entre MapLibre natif et maplibre-gl web). */
export interface MapColors {
  pointCertified: string;
  pointDeclared: string;
  pointUnknown: string;
  pointNotPotable: string;
  pointStroke: string;
  pointOutOfOrderFill: string;
  cluster: string;
  clusterStroke: string;
  clusterText: string;
  selectedHalo: string;
  userLocation: string;
  userLocationStroke: string;
  userAccuracy: string;
}

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceElevated: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  primarySoft: string;
  onPrimarySoft: string;
  danger: string;
  onDanger: string;
  success: StatusColors;
  warning: StatusColors;
  error: StatusColors;
  neutral: StatusColors;
  info: StatusColors;
  /** Bleu source : eau indiquée potable (rassurant, distinct du vert « certifiée »). */
  water: StatusColors;
  overlay: string;
  focusRing: string;
  tabBar: string;
  tabBarBorder: string;
  tabActive: string;
  tabInactive: string;
  map: MapColors;
}

const mapColors: MapColors = {
  // Teintes foncées : contraste ≥ 3:1 sur le fond de carte clair (objets graphiques, WCAG 1.4.11).
  pointCertified: palette.green[700],
  pointDeclared: palette.source.main,
  pointUnknown: palette.slate[600],
  pointNotPotable: palette.rose[700],
  pointStroke: '#FFFFFF',
  pointOutOfOrderFill: '#FFFFFF',
  cluster: palette.source.deep,
  clusterStroke: '#FFFFFF',
  clusterText: '#FFFFFF',
  selectedHalo: palette.source.vif,
  userLocation: '#2563EB',
  userLocationStroke: '#FFFFFF',
  userAccuracy: 'rgba(37, 99, 235, 0.15)',
};

/** Thème clair : bleu source sur les neutres chauds de la famille, statuts de la DA (contrastes testés). */
export const lightColors: ThemeColors = {
  background: palette.sand.surface,
  surface: palette.sand.raised,
  surfaceMuted: palette.sand.sunken,
  surfaceElevated: palette.sand.raised,
  border: palette.sand.line,
  borderStrong: palette.sand.lineStrong,
  text: palette.sand.ink,
  textSecondary: palette.sand.inkSecondary,
  textMuted: palette.sand.inkMuted,
  textInverse: '#FFFFFF',
  primary: palette.source.main,
  primaryPressed: palette.source.pressed,
  onPrimary: '#FFFFFF',
  primarySoft: palette.source.soft,
  onPrimarySoft: palette.source.text,
  danger: '#B8261A',
  onDanger: '#FFFFFF',
  success: { base: '#0B6E5B', soft: '#E0F4EF', onSoft: '#0B6E5B' },
  warning: { base: '#8A5300', soft: '#FFF3D6', onSoft: '#8A5300' },
  error: { base: '#B8261A', soft: '#FDE9E7', onSoft: '#B8261A' },
  neutral: {
    base: palette.sand.inkMuted,
    soft: palette.sand.sunken,
    onSoft: palette.sand.inkSecondary,
  },
  info: { base: '#1F58B0', soft: '#E6EEFB', onSoft: '#1F58B0' },
  water: { base: palette.source.main, soft: palette.source.soft, onSoft: palette.source.text },
  overlay: 'rgba(29, 27, 25, 0.45)',
  focusRing: palette.sand.ink,
  tabBar: palette.sand.raised,
  tabBarBorder: palette.sand.line,
  tabActive: palette.source.main,
  tabInactive: palette.sand.inkMuted,
  map: mapColors,
};

export const darkColors: ThemeColors = {
  background: palette.sand.darkSurface,
  surface: palette.sand.darkRaised,
  surfaceMuted: palette.sand.darkSunken,
  surfaceElevated: palette.sand.darkSunken,
  border: palette.sand.darkLine,
  borderStrong: palette.sand.darkLineStrong,
  text: palette.sand.darkInk,
  textSecondary: palette.sand.darkInkSecondary,
  textMuted: palette.sand.darkInkMuted,
  textInverse: palette.sand.ink,
  primary: palette.source.darkMain,
  primaryPressed: palette.source.darkPressed,
  onPrimary: palette.source.darkOn,
  primarySoft: palette.source.darkSoft,
  onPrimarySoft: palette.source.darkText,
  danger: '#FF8F85',
  onDanger: '#3D1512',
  success: { base: '#5FD3BB', soft: '#0A2A24', onSoft: '#5FD3BB' },
  warning: { base: '#F8BA3C', soft: '#382805', onSoft: '#F8BA3C' },
  error: { base: '#FF8F85', soft: '#3D1512', onSoft: '#FF8F85' },
  neutral: {
    base: palette.sand.darkInkMuted,
    soft: palette.sand.darkSunken,
    onSoft: palette.sand.darkInkSecondary,
  },
  info: { base: '#8FB6F5', soft: '#122444', onSoft: '#8FB6F5' },
  water: {
    base: palette.source.darkMain,
    soft: palette.source.darkSoft,
    onSoft: palette.source.darkText,
  },
  overlay: 'rgba(0, 0, 0, 0.6)',
  focusRing: palette.sand.darkInk,
  tabBar: palette.sand.darkRaised,
  tabBarBorder: palette.sand.darkLine,
  tabActive: palette.source.darkMain,
  tabInactive: palette.sand.darkInkMuted,
  // Le fond de carte reste clair par défaut : les couleurs des marqueurs sont conservées.
  map: mapColors,
};
