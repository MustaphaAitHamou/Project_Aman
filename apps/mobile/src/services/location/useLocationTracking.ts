import { useEffect } from 'react';

import { useAppIsActive } from '@/lib/useAppIsActive';
import { useLocationStore } from '@/stores/location';

import {
  areLocationServicesEnabled,
  getLastKnownPosition,
  watchUserPosition,
} from './location-service';
import type { PositionSubscription } from './types';

/**
 * Pilote unique du suivi de position, monté une seule fois (layout des onglets).
 * Le suivi ne tourne que si l'autorisation est accordée ET que l'application est au premier plan :
 * il s'arrête dès le passage en arrière-plan.
 */
export function useLocationTracking(): void {
  const isActive = useAppIsActive();
  const permission = useLocationStore((state) => state.permission);
  const refreshPermission = useLocationStore((state) => state.refreshPermission);

  // L'utilisateur a pu modifier l'autorisation dans les réglages : on la relit au retour.
  useEffect(() => {
    if (isActive) void refreshPermission();
  }, [isActive, refreshPermission]);

  useEffect(() => {
    if (!isActive || permission !== 'granted') return;

    let cancelled = false;
    let subscription: PositionSubscription | null = null;
    const { setState, getState } = useLocationStore;

    void (async () => {
      const enabled = await areLocationServicesEnabled();
      if (cancelled) return;
      if (!enabled) {
        setState({ servicesEnabled: false, status: 'services_disabled' });
        return;
      }
      setState({ servicesEnabled: true, status: getState().position ? 'tracking' : 'locating' });

      const lastKnown = await getLastKnownPosition();
      if (cancelled) return;
      if (lastKnown && !getState().position) setState({ position: lastKnown });

      try {
        const watcher = await watchUserPosition(
          (position) => setState({ position, status: 'tracking' }),
          () => setState({ status: 'error' }),
        );
        if (cancelled) watcher.remove();
        else subscription = watcher;
      } catch {
        if (!cancelled) setState({ status: 'error' });
      }
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
      setState({ status: 'idle' });
    };
  }, [isActive, permission]);
}
