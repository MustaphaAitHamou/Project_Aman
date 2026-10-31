import { AdsConsent } from 'react-native-google-mobile-ads';

import { useAdsStore } from '@/services/ads/ads-store';
import { initializeAds } from '@/services/ads/consent';

describe('consentement publicitaire', () => {
  it('refus de la personnalisation : annonces non personnalisées uniquement', async () => {
    await initializeAds();
    expect(AdsConsent.gatherConsent).toHaveBeenCalledTimes(1);
    expect(useAdsStore.getState()).toMatchObject({
      status: 'ready',
      canRequestAds: true,
      personalized: false,
      privacyOptionsRequired: true,
    });
    // Appels suivants : pas de nouveau formulaire.
    await initializeAds();
    expect(AdsConsent.gatherConsent).toHaveBeenCalledTimes(1);
  });
});
