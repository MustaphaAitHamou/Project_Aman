import { create } from 'zustand';

import {
  getLocationPermission,
  requestLocationPermission,
} from '@/services/location/location-service';
import type { LocationPermission, TrackingStatus, UserPosition } from '@/services/location/types';

interface LocationState {
  permission: LocationPermission;
  canAskAgain: boolean;
  servicesEnabled: boolean | null;
  /** Dernière position uniquement : aucune liste, aucun historique. */
  position: UserPosition | null;
  status: TrackingStatus;
  refreshPermission: () => Promise<LocationPermission>;
  requestPermission: () => Promise<LocationPermission>;
}

/** État de localisation en mémoire. Volontairement NON persisté. */
export const useLocationStore = create<LocationState>()((set) => ({
  permission: 'unknown',
  canAskAgain: true,
  servicesEnabled: null,
  position: null,
  status: 'idle',
  refreshPermission: async () => {
    try {
      const result = await getLocationPermission();
      set({ permission: result.permission, canAskAgain: result.canAskAgain });
      return result.permission;
    } catch {
      set({ permission: 'undetermined' });
      return 'undetermined';
    }
  },
  requestPermission: async () => {
    try {
      const result = await requestLocationPermission();
      set({ permission: result.permission, canAskAgain: result.canAskAgain });
      return result.permission;
    } catch {
      set({ permission: 'denied' });
      return 'denied';
    }
  },
}));

export function resetLocationStore(): void {
  useLocationStore.setState({
    permission: 'unknown',
    canAskAgain: true,
    servicesEnabled: null,
    position: null,
    status: 'idle',
  });
}
