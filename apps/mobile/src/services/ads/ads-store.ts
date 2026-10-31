import { create } from 'zustand';

/**
 * État publicitaire. `canRequestAds` n'est vrai qu'après le parcours de consentement (UMP) ;
 * `personalized` reflète le choix de l'utilisateur : s'il refuse, seules des publicités non
 * personnalisées sont demandées, et l'application reste entièrement utilisable.
 */
export interface AdsState {
  status: 'idle' | 'initializing' | 'ready' | 'disabled' | 'error';
  canRequestAds: boolean;
  personalized: boolean;
  privacyOptionsRequired: boolean;
  set: (state: Partial<Omit<AdsState, 'set'>>) => void;
}

export const useAdsStore = create<AdsState>()((set) => ({
  status: 'idle',
  canRequestAds: false,
  personalized: false,
  privacyOptionsRequired: false,
  set: (state) => set(state),
}));
