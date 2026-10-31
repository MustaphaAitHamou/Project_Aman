import { useAdsStore } from './ads-store';

/** Aucune publicité sur la version web (aperçu de développement). */
export function initializeAds(): Promise<void> {
  useAdsStore.getState().set({ status: 'disabled' });
  return Promise.resolve();
}

export async function showPrivacyOptions(): Promise<void> {
  // Rien à gérer : aucune publicité ni aucun traceur sur le web.
}
