import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/theme';

import { AppText } from './AppText';

/** Dépassement du bouton central « Ajouter » au-dessus de la barre d'onglets. */
const TAB_BAR_PROTRUSION = 28;

export interface ScreenProps {
  /** Grand titre affiché en haut (écrans d'onglet). Les écrans empilés utilisent l'en-tête natif. */
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

  const header = title ? (
    <View style={{ gap: theme.space.xs, marginBottom: theme.space.sm }}>
      <AppText variant="title1" accessibilityRole="header">
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="callout" tone="secondary">
          {subtitle}
        </AppText>
      ) : null}
    </View>
  ) : null;

  const padding: ViewStyle = {
    paddingTop: (safeTop ? insets.top : 0) + theme.space.lg,
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
