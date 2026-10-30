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
  pointDeclared: palette.water[600],
  pointUnknown: palette.slate[600],
  pointNotPotable: palette.rose[700],
  pointStroke: '#FFFFFF',
  pointOutOfOrderFill: '#FFFFFF',
  cluster: palette.water[700],
  clusterStroke: '#FFFFFF',
  clusterText: '#FFFFFF',
  selectedHalo: palette.water[400],
  userLocation: '#2563EB',
  userLocationStroke: '#FFFFFF',
  userAccuracy: 'rgba(37, 99, 235, 0.15)',
};

export const lightColors: ThemeColors = {
  background: palette.slate[0],
  surface: palette.slate[0],
  surfaceMuted: palette.slate[100],
  surfaceElevated: palette.slate[0],
  border: palette.slate[200],
  borderStrong: palette.slate[500],
  text: palette.slate[925],
  textSecondary: palette.slate[700],
  textMuted: palette.slate[600],
  textInverse: palette.slate[0],
  primary: palette.water[600],
  primaryPressed: palette.water[700],
  onPrimary: '#FFFFFF',
  primarySoft: palette.water[100],
  onPrimarySoft: palette.water[700],
  danger: palette.red[700],
  onDanger: '#FFFFFF',
  success: { base: palette.green[700], soft: palette.green[100], onSoft: palette.green[800] },
  warning: { base: palette.orange[600], soft: palette.orange[100], onSoft: palette.orange[800] },
  error: { base: palette.red[700], soft: palette.red[100], onSoft: palette.red[800] },
  neutral: { base: palette.slate[600], soft: palette.slate[150], onSoft: palette.slate[800] },
  info: { base: palette.water[600], soft: palette.water[100], onSoft: palette.water[700] },
  overlay: 'rgba(11, 18, 32, 0.45)',
  focusRing: palette.water[500],
  tabBar: palette.slate[0],
  tabBarBorder: palette.slate[200],
  tabActive: palette.water[600],
  tabInactive: palette.slate[600],
  map: mapColors,
};

export const darkColors: ThemeColors = {
  background: palette.slate[950],
  surface: palette.slate[900],
  surfaceMuted: palette.slate[850],
  surfaceElevated: palette.slate[850],
  border: palette.slate[850],
  borderStrong: '#5B6B82',
  text: '#F1F5FA',
  textSecondary: '#A9B6C8',
  textMuted: palette.slate[400],
  textInverse: palette.slate[925],
  primary: palette.water[400],
  primaryPressed: '#2E9BE6',
  onPrimary: palette.water[950],
  primarySoft: '#0F2F4D',
  onPrimarySoft: '#9AD5FF',
  danger: palette.red[400],
  onDanger: '#1A0505',
  success: { base: palette.green[300], soft: palette.green[950], onSoft: palette.green[300] },
  warning: { base: palette.orange[300], soft: palette.orange[950], onSoft: palette.orange[300] },
  error: { base: palette.red[300], soft: palette.red[950], onSoft: palette.red[300] },
  neutral: { base: palette.slate[400], soft: palette.slate[850], onSoft: '#CBD5E1' },
  info: { base: palette.water[400], soft: '#0F2F4D', onSoft: '#9AD5FF' },
  overlay: 'rgba(0, 0, 0, 0.6)',
  focusRing: palette.water[400],
  tabBar: palette.slate[900],
  tabBarBorder: palette.slate[850],
  tabActive: palette.water[400],
  tabInactive: palette.slate[400],
  // Le fond de carte reste clair par défaut : les couleurs des marqueurs sont conservées.
  map: mapColors,
};
