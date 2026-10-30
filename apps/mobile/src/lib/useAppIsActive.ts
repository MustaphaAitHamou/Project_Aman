import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

function subscribe(onChange: () => void): () => void {
  const subscription = AppState.addEventListener('change', onChange);
  return () => subscription.remove();
}

/**
 * Vrai tant que l'application n'est pas en arrière-plan. L'état transitoire `inactive`
 * (dialogue de permission, centre de contrôle iOS) est considéré comme actif.
 */
export function useAppIsActive(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => AppState.currentState !== 'background',
    () => true,
  );
}
