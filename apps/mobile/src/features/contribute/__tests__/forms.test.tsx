import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { contributionStatus } from '@/app/contributions';
import { diffChanges } from '@/app/edit-point/[id]';
import NewPointScreen from '@/app/new-point';
import { useSessionStore } from '@/services/auth/session';
import type { WaterPointDetail } from '@/services/water-points/supabase-repository';
import { useLocationStore } from '@/stores/location';

const mockRpc = jest.fn();
jest.mock('@/services/supabase/client', () => ({
  ...jest.requireActual('@/services/supabase/client'),
  getSupabase: () => ({ rpc: mockRpc }),
}));

const mockRouter = {
  navigate: jest.fn(),
  push: jest.fn(),
  back: jest.fn(),
  replace: jest.fn(),
  canGoBack: () => true,
};
jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  useRouter: () => mockRouter,
}));

function wrap(children: ReactNode) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;
}

const signIn = () =>
  useSessionStore.setState({
    status: 'signedIn',
    session: { user: { id: 'u1', email: 'a@b.fr' } } as never,
    profile: null,
  });

describe('ajout d’un point', () => {
  beforeEach(() => {
    mockRpc.mockReset();
    useLocationStore.setState({
      position: { latitude: 48.8566, longitude: 2.3522, accuracy: 8, timestamp: 0 },
    });
  });

  it('un visiteur non connecté voit une invitation à se connecter, pas le formulaire', async () => {
    useSessionStore.setState({ status: 'signedOut', session: null, profile: null });
    await render(wrap(<NewPointScreen />));
    expect(screen.getByText('Compte nécessaire')).toBeTruthy();
    expect(screen.queryByTestId('new-point-submit')).toBeNull();
  });

  it('envoie la position GPS et une déclaration de potabilité, jamais une certification', async () => {
    signIn();
    mockRpc.mockResolvedValue({ data: 'new-id', error: null });
    await render(wrap(<NewPointScreen />));
    expect(screen.getByTestId('new-point-coordinates')).toHaveTextContent(/48\.856600, 2\.352200/);
    await fireEvent.press(screen.getByTestId('new-point-submit'));
    await waitFor(() => expect(screen.getByTestId('contribution-submitted')).toBeTruthy());
    expect(mockRpc).toHaveBeenCalledWith(
      'submit_water_point',
      expect.objectContaining({
        kind: 'drinking_fountain',
        latitude: 48.8566,
        longitude: 2.3522,
        potability_claim: 'unknown',
        name: null,
      }),
    );
  });

  it('doublon à proximité : message et lien vers le point existant', async () => {
    signIn();
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'duplicate_nearby', details: 'other-id' },
    });
    await render(wrap(<NewPointScreen />));
    await fireEvent.press(screen.getByTestId('new-point-submit'));
    await waitFor(() =>
      expect(screen.getByText('Un point d’eau existe déjà à moins de 15 m.')).toBeTruthy(),
    );
    await fireEvent.press(screen.getByText('Voir le point existant'));
    expect(mockRouter.replace).toHaveBeenCalledWith({
      pathname: '/point/[id]',
      params: { id: 'other-id' },
    });
  });

  it('GPS imprécis : envoi impossible tant qu’aucun emplacement fiable n’est choisi', async () => {
    signIn();
    useLocationStore.setState({
      position: { latitude: 48.8, longitude: 2.3, accuracy: 400, timestamp: 0 },
    });
    await render(wrap(<NewPointScreen />));
    expect(screen.queryByTestId('new-point-coordinates')).toBeNull();
    await fireEvent.press(screen.getByTestId('new-point-submit'));
    expect(mockRpc).not.toHaveBeenCalled();
  });
});

describe('proposition de modification', () => {
  const point = {
    id: 'p',
    name: 'Fontaine',
    kind: 'drinking_fountain',
    waterType: 'still',
    isFree: true,
    wheelchairAccessible: null,
    openingHours: null,
    address: null,
  } as unknown as WaterPointDetail;

  it('n’envoie que les champs modifiés', () => {
    expect(
      diffChanges(point, {
        name: ' Fontaine ',
        kind: 'drinking_fountain',
        water_type: 'sparkling',
        is_free: true,
        wheelchair_accessible: true,
        opening_hours: '  ',
        address: '',
      }),
    ).toEqual({ water_type: 'sparkling', wheelchair_accessible: true });
  });
});

describe('statut des contributions', () => {
  it('correspondance des statuts de modération', () => {
    expect(contributionStatus('published').key).toBe('approved');
    expect(contributionStatus('pending').key).toBe('pending');
    expect(contributionStatus('rejected').tone).toBe('error');
    expect(contributionStatus('merged').key).toBe('merged');
  });
});
