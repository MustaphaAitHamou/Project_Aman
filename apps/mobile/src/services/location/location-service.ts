import { isValidCoordinates } from '@water-finder/core';
import * as Location from 'expo-location';

import type { PermissionResult, PositionSubscription, UserPosition } from './types';

/**
 * Accès à la localisation, au premier plan uniquement.
 * Aucune tâche d'arrière-plan, aucun géorepérage, aucun historique.
 */

function toPermissionResult(response: Location.LocationPermissionResponse): PermissionResult {
  const permission =
    response.status === Location.PermissionStatus.GRANTED
      ? 'granted'
      : response.status === Location.PermissionStatus.DENIED
        ? 'denied'
        : 'undetermined';
  return { permission, canAskAgain: response.canAskAgain };
}

export async function getLocationPermission(): Promise<PermissionResult> {
  return toPermissionResult(await Location.getForegroundPermissionsAsync());
}

export async function requestLocationPermission(): Promise<PermissionResult> {
  return toPermissionResult(await Location.requestForegroundPermissionsAsync());
}

/** Vrai si le GPS / les services de localisation de l'appareil sont activés. */
export async function areLocationServicesEnabled(): Promise<boolean> {
  try {
    return await Location.hasServicesEnabledAsync();
  } catch {
    // En cas d'API indisponible (ex. certains navigateurs), on laisse la demande de position décider.
    return true;
  }
}

export function toUserPosition(location: Location.LocationObject): UserPosition | null {
  const { latitude, longitude, accuracy } = location.coords;
  if (!isValidCoordinates({ latitude, longitude })) return null;
  return { latitude, longitude, accuracy: accuracy ?? null, timestamp: location.timestamp };
}

/** Position récente déjà connue du système, pour un affichage immédiat. */
export async function getLastKnownPosition(): Promise<UserPosition | null> {
  try {
    const location = await Location.getLastKnownPositionAsync({
      maxAge: 2 * 60_000,
      requiredAccuracy: 500,
    });
    return location ? toUserPosition(location) : null;
  } catch {
    return null;
  }
}

export const WATCH_OPTIONS: Location.LocationOptions = {
  accuracy: Location.Accuracy.High,
  distanceInterval: 10,
  timeInterval: 5000,
  mayShowUserSettingsDialog: true,
};

export async function watchUserPosition(
  onPosition: (position: UserPosition) => void,
  onError: (reason: string) => void,
): Promise<PositionSubscription> {
  return Location.watchPositionAsync(
    WATCH_OPTIONS,
    (location) => {
      const position = toUserPosition(location);
      if (position) onPosition(position);
    },
    onError,
  );
}
