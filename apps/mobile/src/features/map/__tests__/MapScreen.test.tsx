import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { DEFAULT_FILTERS } from '@water-finder/core';

import { resetLocationStore, useLocationStore } from '@/stores/location';
import { useMapCameraStore } from '@/stores/map-camera';
import { DEFAULT_PREFERENCES, usePreferencesStore } from '@/stores/preferences';
import { createDemoRepository } from '@/services/water-points/demo/demo-repository';
import { setWaterPointRepositoryForTesting } from '@/services/water-points/registry';

import { MapScreen } from '../MapScreen';
import type { WaterMapProps } from '../WaterMap.types';

const mockRouter = { navigate: jest.fn(), push: jest.fn(), back: jest.fn(), replace: jest.fn() };
jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  useRouter: () => mockRouter,
}));

jest.mock('expo-location', () => ({
  PermissionStatus: { GRANTED: 'granted', DENIED: 'denied', UNDETERMINED: 'undetermined' },
  Accuracy: { High: 4 },
  requestForegroundPermissionsAsync: jest.fn(async () => ({
    status: 'granted',
    canAskAgain: true,
  })),
  getForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted', canAskAgain: true })),
}));

// Double de la carte : capture les props et les appels de caméra (le rendu natif n'existe pas en test).
const mockCamera = { flyTo: jest.fn(), easeTo: jest.fn() };
let mockMapProps: WaterMapProps | null = null;
jest.mock('../WaterMap', () => {
  const { useImperativeHandle } = jest.requireActual<typeof import('react')>('react');
  return {
    WaterMap: (props: WaterMapProps) => {
      mockMapProps = props;
      useImperativeHandle(props.ref, () => mockCamera);
      return null;
    },
  };
});

const PARIS = { latitude: 48.8566, longitude: 2.3522 };

function renderScreen() {
  // gcTime infini : aucune minuterie de nettoyage ne maintient le processus de test en vie.
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MapScreen />
    </QueryClientProvider>,
  );
}

function mapProps(): WaterMapProps {
  if (!mockMapProps) throw new Error('carte non rendue');
  return mockMapProps;
}

async function showParis() {
  await act(async () =>
    mapProps().onViewportChange({
      bounds: [2.34, 48.85, 2.365, 48.862],
      zoom: 15,
      center: [PARIS.longitude, PARIS.latitude],
      userInteraction: false,
    }),
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockMapProps = null;
  resetLocationStore();
  useMapCameraStore.setState({ pendingTarget: null });
  usePreferencesStore.setState({
    ...DEFAULT_PREFERENCES,
    filters: { ...DEFAULT_FILTERS },
    hasCompletedOnboarding: true,
  });
  setWaterPointRepositoryForTesting(createDemoRepository({ latencyMs: 0 }));
});

afterAll(() => setWaterPointRepositoryForTesting(undefined));

describe('MapScreen', () => {
  it('indique honnêtement l’absence de source de données', async () => {
    setWaterPointRepositoryForTesting(null);
    await renderScreen();
    expect(screen.getByTestId('map-notice-noSource')).toBeOnTheScreen();
  });

  it('demande de zoomer tant qu’aucune zone exploitable n’est affichée', async () => {
    await renderScreen();
    expect(screen.getByTestId('map-notice-zoomIn')).toBeOnTheScreen();
  });

  it('affiche les points de la zone puis le panneau au toucher d’un point', async () => {
    useLocationStore.setState({
      permission: 'granted',
      position: {
        latitude: PARIS.latitude,
        longitude: PARIS.longitude,
        accuracy: 10,
        timestamp: 0,
      },
    });
    await renderScreen();
    await showParis();
    await waitFor(() => expect(mapProps().points.features.length).toBeGreaterThan(0));

    await act(async () => mapProps().onPointPress('demo-1'));
    expect(screen.getByTestId('point-preview')).toBeOnTheScreen();
    expect(screen.getByText('Point de démonstration n°1')).toBeOnTheScreen();
    expect(screen.getByTestId('point-preview-subtitle')).toHaveTextContent(
      'Fontaine à boire · à 70 m',
    );
    expect(mapProps().selectedPointId).toBe('demo-1');
    expect(mockCamera.easeTo).toHaveBeenCalled();

    await fireEvent.press(screen.getByTestId('point-preview-details'));
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/point/[id]',
      params: { id: 'demo-1' },
    });

    await act(async () => mapProps().onMapPress());
    expect(screen.queryByTestId('point-preview')).toBeNull();
  });

  it('centre la carte sur l’utilisateur à la première position', async () => {
    await renderScreen();
    expect(mockCamera.flyTo).not.toHaveBeenCalled();
    await act(async () =>
      useLocationStore.setState({
        permission: 'granted',
        position: { ...PARIS, accuracy: 10, timestamp: 0 },
      }),
    );
    expect(mockCamera.flyTo).toHaveBeenCalledWith([PARIS.longitude, PARIS.latitude], 15);
  });

  it('demande l’autorisation au toucher du bouton de recentrage', async () => {
    useLocationStore.setState({ permission: 'undetermined' });
    await renderScreen();
    await fireEvent.press(screen.getByTestId('recenter-button'));
    await waitFor(() => expect(useLocationStore.getState().permission).toBe('granted'));
  });

  it('affiche les filtres actifs et permet de les retirer', async () => {
    usePreferencesStore.getState().updateFilters({ freeOnly: true });
    await renderScreen();
    const chip = screen.getByRole('button', { name: 'Retirer le filtre Gratuit' });
    await fireEvent.press(chip);
    expect(usePreferencesStore.getState().filters.freeOnly).toBe(false);
  });

  it('applique un déplacement demandé par la recherche', async () => {
    await renderScreen();
    await act(async () =>
      useMapCameraStore.getState().requestCamera({ center: [4.8357, 45.764], zoom: 13 }),
    );
    expect(mockCamera.flyTo).toHaveBeenCalledWith([4.8357, 45.764], 13);
    expect(useMapCameraStore.getState().pendingTarget).toBeNull();
  });

  it('propose de réessayer si le fond de carte ne charge pas', async () => {
    await renderScreen();
    await act(async () => mapProps().onStyleError());
    expect(screen.getByTestId('map-style-error')).toBeOnTheScreen();
    mockMapProps = null;
    await fireEvent.press(screen.getByRole('button', { name: 'Réessayer' }));
    expect(mockMapProps).not.toBeNull();
  });
});
