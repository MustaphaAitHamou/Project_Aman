import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { palette, useAppTheme } from '@/theme';

import { Bubbles } from './Bubbles';
import { DropMascot } from './DropMascot';
import { Waves } from './Waves';

const WAVE_HEIGHT = 22;

/** `#RRGGBB` → `rgba(…, alpha)` (couleurs de thème, toutes en hexadécimal). */
export function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return hex;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export interface BrandHeroProps {
  title: string;
  subtitle?: string;
  /** Contenu sous le titre (champ de recherche…). */
  children?: ReactNode;
  /** Petite goutte animée à droite du titre. */
  mascot?: boolean;
  safeTop?: boolean;
  testID?: string;
}

/**
 * Bandeau d'écran aux couleurs de Water Finder : bleu source, bulles qui montent, mascotte et
 * vagues qui se fondent dans le fond de page. Texte blanc sur bleu (contraste ≥ 4,5:1).
 */
export function BrandHero({
  title,
  subtitle,
  children,
  mascot = true,
  safeTop = true,
  testID,
}: BrandHeroProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const background = theme.scheme === 'dark' ? palette.source.deep : palette.source.main;

  return (
    <View
      testID={testID}
      style={[
        styles.hero,
        {
          backgroundColor: background,
          paddingTop: (safeTop ? insets.top : 0) + theme.space.lg,
          paddingHorizontal: theme.space.lg,
          paddingBottom: theme.space.lg + WAVE_HEIGHT,
          gap: theme.space.md,
        },
      ]}
    >
      <Bubbles rise={96} />
      <View style={[styles.titleRow, { gap: theme.space.md }]}>
        <View style={[styles.titleText, { gap: theme.space.xs }]}>
          <AppText variant="title1" style={styles.title} accessibilityRole="header">
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="callout" style={styles.subtitle}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {mascot ? (
          <DropMascot
            size={40}
            ripples={false}
            shadow={false}
            color={palette.source.darkMain}
            style={styles.mascot}
          />
        ) : null}
      </View>
      {children}
      <Waves
        color={theme.colors.background}
        backColor={withAlpha(theme.colors.background, 0.45)}
        height={WAVE_HEIGHT}
        style={styles.waves}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    overflow: 'hidden',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  titleText: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.92)',
  },
  mascot: {
    marginBottom: -6,
  },
  waves: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -1,
  },
});
