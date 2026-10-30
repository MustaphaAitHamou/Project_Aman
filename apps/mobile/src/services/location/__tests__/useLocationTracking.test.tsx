import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { AppState, type AppStateStatus } from 'react-native';

import { resetLocationStore, useLocationStore } from '@/stores/location';

import { useLocationTracking } from '../useLocationTracking';

jest.mock('expo-location', () => ({
  PermissionStatus: { GRANTED: 'granted', DENIED: 'denied', UNDETERMINED: 'undetermined' },
  Accuracy: { High: 4, Balanced: 3 },
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  watchPositionAsync: jest.fn(),
}));

const mocked = Location as jest.Mocked<typeof Location>;

function permissionResponse(status: 'granted' | 'denied' | 'undetermined', canAskAgain = true) {
  return {
    status,
    canAskAgain,
    granted: status === 'granted',
    expires: 'never',
  } as Location.LocationPermissionResponse;
}

function locationObject(
  latitude: number,
  longitude: number,
  accuracy = 12,
): Location.LocationObject {
  return {
    coords: {
      latitude,
      longitude,
      accuracy,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: 1_700_000_000_000,
  };
}

// Simulation d'AppState : on capte l'abonnement pour émettre des changements d'état.
let appStateListener: ((state: AppStateStatus) => void) | null = null;
let currentAppState: AppStateStatus = 'active';

beforeEach(() => {
  jest.clearAllMocks();
  resetLocationStore();
  currentAppState = 'active';
  Object.defineProperty(AppState, 'currentState', {
    get: () => currentAppState,
    configurable: true,
  });
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
    appStateListener = listener as (state: AppStateStatus) => void;
    return { remove: () => (appStateListener = null) } as ReturnType<
      typeof AppState.addEventListener
    >;
  });
  mocked.hasServicesEnabledAsync.mockResolvedValue(true);
  mocked.getLastKnownPositionAsync.mockResolvedValue(null);
});

function setAppState(state: AppStateStatus) {
  currentAppState = state;
  appStateListener?.(state);
}

describe('store de localisation', () => {
  it('traduit les réponses d’autorisation', async () => {
    mocked.requestForegroundPermissionsAsync.mockResolvedValueOnce(
      permissionResponse('denied', false),
    );
    await act(() => useLocationStore.getState().requestPermission());
    expect(useLocationStore.getState()).toMatchObject({ permission: 'denied', canAskAgain: false });

    mocked.getForegroundPermissionsAsync.mockResolvedValueOnce(permissionResponse('granted'));
    await act(() => useLocationStore.getState().refreshPermission());
    expect(useLocationStore.getState().permission).toBe('granted');
  });

  it('considère une erreur de demande comme un refus', async () => {
    mocked.requestForegroundPermissionsAsync.mockRejectedValueOnce(new Error('boom'));
    await act(() => useLocationStore.getState().requestPermission());
    expect(useLocationStore.getState().permission).toBe('denied');
  });
});

describe('useLocationTracking', () => {
  it('ne suit pas la position sans autorisation', async () => {
    mocked.getForegroundPermissionsAsync.mockResolvedValue(permissionResponse('undetermined'));
    await renderHook(() => useLocationTracking());
    await waitFor(() => expect(useLocationStore.getState().permission).toBe('undetermined'));
    expect(mocked.watchPositionAsync).not.toHaveBeenCalled();
  });

  it('suit la position au premier plan et ne garde que la dernière', async () => {
    mocked.getForegroundPermissionsAsync.mockResolvedValue(permissionResponse('granted'));
    let emit: ((location: Location.LocationObject) => void) | undefined;
    const remove = jest.fn();
    mocked.watchPositionAsync.mockImplementation(async (_options, callback) => {
      emit = callback;
      return { remove };
    });

    await renderHook(() => useLocationTracking());
    await waitFor(() => expect(mocked.watchPositionAsync).toHaveBeenCalledTimes(1));
    expect(mocked.watchPositionAsync.mock.calls[0]?.[0]).toMatchObject({
      accuracy: Location.Accuracy.High,
    });

    await act(async () => emit?.(locationObject(48.85, 2.35)));
    await act(async () => emit?.(locationObject(48.86, 2.36)));
    const state = useLocationStore.getState();
    expect(state.status).toBe('tracking');
    expect(state.position).toMatchObject({ latitude: 48.86, longitude: 2.36, accuracy: 12 });
  });

  it('arrête le suivi en arrière-plan et le reprend au retour', async () => {
    mocked.getForegroundPermissionsAsync.mockResolvedValue(permissionResponse('granted'));
    const remove = jest.fn();
    mocked.watchPositionAsync.mockResolvedValue({ remove });

    await renderHook(() => useLocationTracking());
    await waitFor(() => expect(mocked.watchPositionAsync).toHaveBeenCalledTimes(1));

    await act(async () => setAppState('background'));
    expect(remove).toHaveBeenCalledTimes(1);
    expect(useLocationStore.getState().status).toBe('idle');

    await act(async () => setAppState('active'));
    await waitFor(() => expect(mocked.watchPositionAsync).toHaveBeenCalledTimes(2));
  });

  it('signale des services de localisation désactivés', async () => {
    mocked.getForegroundPermissionsAsync.mockResolvedValue(permissionResponse('granted'));
    mocked.hasServicesEnabledAsync.mockResolvedValue(false);

    await renderHook(() => useLocationTracking());
    await waitFor(() => expect(useLocationStore.getState().status).toBe('services_disabled'));
    expect(mocked.watchPositionAsync).not.toHaveBeenCalled();
  });

  it('utilise la dernière position connue en attendant le GPS', async () => {
    mocked.getForegroundPermissionsAsync.mockResolvedValue(permissionResponse('granted'));
    mocked.getLastKnownPositionAsync.mockResolvedValue(locationObject(43.3, 5.37, 80));
    mocked.watchPositionAsync.mockResolvedValue({ remove: jest.fn() });

    await renderHook(() => useLocationTracking());
    await waitFor(() =>
      expect(useLocationStore.getState().position).toMatchObject({ latitude: 43.3 }),
    );
  });

  it('ignore des coordonnées invalides', async () => {
    mocked.getForegroundPermissionsAsync.mockResolvedValue(permissionResponse('granted'));
    let emit: ((location: Location.LocationObject) => void) | undefined;
    mocked.watchPositionAsync.mockImplementation(async (_options, callback) => {
      emit = callback;
      return { remove: jest.fn() };
    });

    await renderHook(() => useLocationTracking());
    await waitFor(() => expect(emit).toBeDefined());
    await act(async () => emit?.(locationObject(123, 2.35)));
    expect(useLocationStore.getState().position).toBeNull();
  });
});
