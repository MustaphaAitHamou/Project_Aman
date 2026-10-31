import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { Platform } from 'react-native';
import mobileAds, {
  AdsConsent,
  AdsConsentPrivacyOptionsRequirementStatus,
  type AdsConsentInfo,
} from 'react-native-google-mobile-ads';

import { env } from '@/config/env';

import { useAdsStore } from './ads-store';

let initialization: Promise<void> | null = null;

async function applyConsent(info: AdsConsentInfo): Promise<void> {
  let personalized = false;
  if (info.canRequestAds) {
    const choices = await AdsConsent.getUserChoices().catch(() => null);
    personalized = !!choices?.selectPersonalisedAds;
  }
  useAdsStore.getState().set({
    canRequestAds: info.canRequestAds,
    personalized,
    privacyOptionsRequired:
      info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
  });
}

/**
 * Parcours de consentement puis initialisation du SDK, en tâche de fond : rien n'est bloquant
 * (la carte et le GPS fonctionnent pendant ce temps et en cas d'échec).
 * 1. UMP (Google, certifié TCF v2.2) : formulaire RGPD si nécessaire.
 * 2. iOS : demande App Tracking Transparency, seulement si les annonces sont autorisées.
 * 3. Initialisation de Google Mobile Ads.
 */
export function initializeAds(): Promise<void> {
  if (!env.adsEnabled) {
    useAdsStore.getState().set({ status: 'disabled' });
    return Promise.resolve();
  }
  initialization ??= (async () => {
    const store = useAdsStore.getState();
    store.set({ status: 'initializing' });
    try {
      const info = await AdsConsent.gatherConsent();
      if (info.canRequestAds && Platform.OS === 'ios') {
        await requestTrackingPermissionsAsync().catch(() => undefined);
      }
      await applyConsent(info);
      if (info.canRequestAds) await mobileAds().initialize();
      useAdsStore.getState().set({ status: 'ready' });
    } catch {
      // Hors ligne ou formulaire indisponible : on retentera au prochain lancement.
      initialization = null;
      useAdsStore.getState().set({ status: 'error', canRequestAds: false });
    }
  })();
  return initialization;
}

/** Formulaire « Gérer mes choix publicitaires » (obligatoire quand UMP l'exige). */
export async function showPrivacyOptions(): Promise<void> {
  const info = await AdsConsent.showPrivacyOptionsForm();
  await applyConsent(info);
}
