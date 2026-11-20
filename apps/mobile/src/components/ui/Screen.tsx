import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandHero } from '@/components/brand/BrandHero';
import { useAppTheme } from '@/theme';

/** Dépassement du bouton central « Ajouter » au-dessus de la barre d'onglets. */
const TAB_BAR_PROTRUSION = 28;

export interface ScreenProps {
  /**
   * Grand titre affiché dans le bandeau animé de la marque (écrans d'onglet). Les écrans empilés
   * utilisent l'en-tête natif.
   */
  title?: string;
  subtitle?: string;
  children: ReactNode;
  scroll?: boolean;
  /** Ajoute la marge de sécurité supérieure (inutile sous un en-tête natif). */
  safeTop?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Screen({
  title,
  subtitle,
  children,
  scroll = true,
  safeTop = true,
  contentStyle,
  testID,
}: ScreenProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  // Le bandeau occupe toute la largeur, au-dessus du contenu (marges négatives).
  const header = title ? (
    <View style={{ marginHorizontal: -theme.space.lg }}>
      <BrandHero title={title} subtitle={subtitle} safeTop={safeTop} />
    </View>
  ) : null;

  const padding: ViewStyle = {
    paddingTop: title ? 0 : (safeTop ? insets.top : 0) + theme.space.lg,
    paddingHorizontal: theme.space.lg,
    paddingBottom: theme.space['3xl'] + TAB_BAR_PROTRUSION,
    gap: theme.space['2xl'],
  };

  if (!scroll) {
    return (
      <View
        testID={testID}
        style={[styles.flex, { backgroundColor: theme.colors.background }, padding, contentStyle]}
      >
        {header}
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      testID={testID}
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[padding, contentStyle]}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      {header}
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
