import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui';
// L'import initialise aussi i18next (effet de bord du module).
import { useLanguageSync } from '@/i18n';
import { initializeAds } from '@/services/ads/consent';
import { useAuthListener } from '@/services/auth/session';
import { usePreferencesHydrated, usePreferencesStore } from '@/stores/preferences';
import { AppThemeProvider, useAppTheme } from '@/theme';

// L'écran de lancement reste affiché jusqu'au chargement des préférences locales.
SplashScreen.preventAutoHideAsync().catch(() => undefined);
SplashScreen.setOptions({ duration: 300, fade: true });

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      // Cache conservé 30 min : les zones déjà parcourues s'affichent instantanément.
      queries: { retry: 2, refetchOnWindowFocus: false, gcTime: 30 * 60_000 },
    },
  });
}

export default function RootLayout() {
  const [queryClient] = useState(createQueryClient);

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppThemeProvider>
            <RootNavigator />
          </AppThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const hydrated = usePreferencesHydrated();
  const hasCompletedOnboarding = usePreferencesStore((state) => state.hasCompletedOnboarding);
  useLanguageSync();
  useAuthListener();

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync().catch(() => undefined);
  }, [hydrated]);

  // Consentement publicitaire demandé après la présentation, jamais au premier écran,
  // et en tâche de fond : la carte reste utilisable pendant ce temps.
  useEffect(() => {
    if (hydrated && hasCompletedOnboarding) void initializeAds();
  }, [hydrated, hasCompletedOnboarding]);

  if (!hydrated) return null;

  return (
    <Stack
      screenOptions={{
        headerTintColor: theme.colors.primary,
        headerTitleStyle: { color: theme.colors.text },
        headerStyle: { backgroundColor: theme.colors.surface },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Protected guard={!hasCompletedOnboarding}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={hasCompletedOnboarding}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="filters"
          options={{ presentation: 'modal', title: t('filters.title') }}
        />
        <Stack.Screen
          name="map-legend"
          options={{ presentation: 'modal', title: t('legend.title') }}
        />
        <Stack.Screen name="point/[id]" options={{ title: t('pointDetail.title') }} />
        <Stack.Screen name="settings" options={{ title: t('settings.title') }} />
        <Stack.Screen name="privacy" options={{ title: t('privacy.title') }} />
        <Stack.Screen name="sources" options={{ title: t('sources.title') }} />
        <Stack.Screen name="sign-in" options={{ title: t('auth.signInTitle') }} />
        <Stack.Screen name="sign-up" options={{ title: t('auth.signUpTitle') }} />
        <Stack.Screen name="favorites" options={{ title: t('favorites.title') }} />
        <Stack.Screen name="contributions" options={{ title: t('contributions.title') }} />
        <Stack.Screen name="new-point" options={{ title: t('add.addPoint') }} />
        <Stack.Screen name="report/[id]" options={{ title: t('report.title') }} />
        <Stack.Screen name="edit-point/[id]" options={{ title: t('add.suggestEdit') }} />
        <Stack.Screen name="add-photo/[id]" options={{ title: t('add.addPhoto') }} />
      </Stack.Protected>
      <Stack.Screen name="+not-found" options={{ title: t('notFound.title') }} />
    </Stack>
  );
}

/** Écran affiché si une erreur inattendue survient dans l'application. */
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  const { t } = useTranslation();
  return (
    <View style={[styles.flex, styles.center]}>
      <EmptyState
        icon="alert-circle-outline"
        tone="error"
        title={t('errors.generic')}
        action={{ label: t('common.retry'), icon: 'refresh', onPress: () => void retry() }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
