import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
  type Theme,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { createContext, use, useEffect, useMemo, type ReactNode } from 'react';
import { Appearance, Platform, StyleSheet, useColorScheme } from 'react-native';

import { usePreferencesStore } from '@/stores/preferences';

import type { ColorScheme } from './colors';
import { getTheme, lightTheme, type AppTheme } from './theme';

const ThemeContext = createContext<AppTheme>(lightTheme);

function toNavigationTheme(theme: AppTheme): Theme {
  const base = theme.scheme === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    dark: theme.scheme === 'dark',
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.danger,
    },
  };
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const preference = usePreferencesStore((state) => state.themePreference);
  const systemScheme = useColorScheme();
  const scheme: ColorScheme =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;
  const theme = getTheme(scheme);

  useEffect(() => {
    // Aligne aussi les éléments natifs (alertes, clavier) sur le choix de l'utilisateur.
    if (Platform.OS !== 'web') {
      Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
    }
  }, [preference]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.background).catch(() => undefined);
  }, [theme.colors.background]);

  const navigationTheme = useMemo(() => toNavigationTheme(theme), [theme]);

  return (
    <ThemeContext value={theme}>
      <NavigationThemeProvider value={navigationTheme}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        {children}
      </NavigationThemeProvider>
    </ThemeContext>
  );
}

export function useAppTheme(): AppTheme {
  return use(ThemeContext);
}

/**
 * Crée des styles dépendant du thème. `factory` doit être définie au niveau du module
 * (référence stable) pour que les styles ne soient recalculés qu'au changement de thème.
 */
export function useThemedStyles<T extends Parameters<typeof StyleSheet.create>[0]>(
  factory: (theme: AppTheme) => T,
): Readonly<T> {
  const theme = useAppTheme();
  return useMemo(() => StyleSheet.create(factory(theme)), [factory, theme]);
}
