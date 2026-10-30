export type LocationPermission = 'unknown' | 'undetermined' | 'granted' | 'denied';

export interface PermissionResult {
  permission: Exclude<LocationPermission, 'unknown'>;
  /** Faux si le système n'affichera plus la demande : il faut passer par les réglages. */
  canAskAgain: boolean;
}

/** Dernière position connue, conservée en mémoire uniquement (jamais persistée ni envoyée). */
export interface UserPosition {
  latitude: number;
  longitude: number;
  /** Rayon d'incertitude en mètres. */
  accuracy: number | null;
  timestamp: number;
}

export type TrackingStatus = 'idle' | 'locating' | 'tracking' | 'services_disabled' | 'error';

export interface PositionSubscription {
  remove: () => void;
}
