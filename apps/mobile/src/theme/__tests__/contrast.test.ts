import { contrastRatio } from '../contrast';
import { darkColors, lightColors, type ThemeColors } from '../colors';

const AA_TEXT = 4.5;
const AA_NON_TEXT = 3;
/** Fonds de carte clairs représentatifs (terre / végétation des styles OpenStreetMap). */
const LIGHT_MAP_BACKGROUNDS = ['#F2EFE9', '#F8F4F0', '#E8EEF3'];

function textPairs(colors: ThemeColors): [string, string, string][] {
  return [
    ['text / background', colors.text, colors.background],
    ['text / surface', colors.text, colors.surface],
    ['textSecondary / background', colors.textSecondary, colors.background],
    ['textSecondary / surfaceMuted', colors.textSecondary, colors.surfaceMuted],
    ['textMuted / surface', colors.textMuted, colors.surface],
    ['primary (lien) / background', colors.primary, colors.background],
    ['onPrimary / primary', colors.onPrimary, colors.primary],
    ['onPrimary / primaryPressed', colors.onPrimary, colors.primaryPressed],
    ['onPrimarySoft / primarySoft', colors.onPrimarySoft, colors.primarySoft],
    ['onDanger / danger', colors.onDanger, colors.danger],
    ['tabActive / tabBar', colors.tabActive, colors.tabBar],
    ['tabInactive / tabBar', colors.tabInactive, colors.tabBar],
    ...(['success', 'warning', 'error', 'neutral', 'info'] as const).map(
      (tone): [string, string, string] => [
        `${tone}.onSoft / ${tone}.soft`,
        colors[tone].onSoft,
        colors[tone].soft,
      ],
    ),
  ];
}

describe.each([
  ['clair', lightColors],
  ['sombre', darkColors],
])('thème %s : contrastes WCAG AA', (_name, colors) => {
  it.each(textPairs(colors))('%s ≥ 4,5:1', (_label, foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('bordure des champs ≥ 3:1 (composant d’interface)', () => {
    expect(contrastRatio(colors.borderStrong, colors.surface)).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });
});

describe('marqueurs de la carte', () => {
  const markers = lightColors.map;
  it.each(LIGHT_MAP_BACKGROUNDS)('contraste ≥ 3:1 sur le fond %s', (background) => {
    for (const color of [
      markers.pointCertified,
      markers.pointDeclared,
      markers.pointUnknown,
      markers.pointNotPotable,
      markers.cluster,
    ]) {
      expect(contrastRatio(color, background)).toBeGreaterThanOrEqual(AA_NON_TEXT);
    }
  });

  it('les quatre statuts de potabilité ont des couleurs distinctes', () => {
    const colors = new Set([
      markers.pointCertified,
      markers.pointDeclared,
      markers.pointUnknown,
      markers.pointNotPotable,
    ]);
    expect(colors.size).toBe(4);
  });
});

describe('contrastRatio', () => {
  it('donne 21:1 pour noir sur blanc et 1:1 pour une même couleur', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#0075C4', '#0075C4')).toBeCloseTo(1, 5);
  });

  it('rejette une couleur non hexadécimale', () => {
    expect(() => contrastRatio('rgba(0,0,0,0.5)', '#FFFFFF')).toThrow();
  });
});
