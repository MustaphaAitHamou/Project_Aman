import { fireEvent, render, screen } from '@testing-library/react-native';

import { WaterPointStatusList } from '@/features/water-points/components/WaterPointStatusList';

import { Banner } from '../Banner';
import { Button } from '../Button';
import { SegmentedControl } from '../SegmentedControl';
import { StatusBadge } from '../StatusBadge';

describe('Button', () => {
  it('expose un rôle et un libellé accessibles et déclenche l’action', async () => {
    const onPress = jest.fn();
    await render(<Button label="Itinéraire" onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Itinéraire' });
    await fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('ne déclenche rien lorsqu’il est désactivé ou en chargement', async () => {
    const onPress = jest.fn();
    await render(
      <>
        <Button label="A" onPress={onPress} disabled />
        <Button label="B" onPress={onPress} loading />
      </>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'A' }));
    await fireEvent.press(screen.getByRole('button', { name: 'B' }));
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'A' })).toBeDisabled();
  });
});

describe('SegmentedControl', () => {
  it('expose des boutons radio et signale la sélection', async () => {
    const onChange = jest.fn();
    await render(
      <SegmentedControl
        accessibilityLabel="Apparence"
        options={[
          { value: 'light', label: 'Clair' },
          { value: 'dark', label: 'Sombre' },
        ]}
        value="light"
        onChange={onChange}
      />,
    );
    expect(screen.getByRole('radio', { name: 'Clair' })).toBeChecked();
    await fireEvent.press(screen.getByRole('radio', { name: 'Sombre' }));
    expect(onChange).toHaveBeenCalledWith('dark');
  });
});

describe('StatusBadge et Banner', () => {
  it('affichent toujours un texte (la couleur n’est jamais seule)', async () => {
    const onAction = jest.fn();
    await render(
      <>
        <StatusBadge tone="warning" icon="alert-outline" label="Information ancienne" />
        <Banner
          tone="error"
          message="Impossible de charger"
          actionLabel="Réessayer"
          onAction={onAction}
        />
      </>,
    );
    expect(screen.getByText('Information ancienne')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Réessayer' }));
    expect(onAction).toHaveBeenCalled();
  });
});

describe('WaterPointStatusList', () => {
  it('affiche séparément potabilité, fonctionnement et accès', async () => {
    await render(
      <WaterPointStatusList
        point={{
          potability: 'declared_potable',
          operationalStatus: 'out_of_order',
          availability: 'seasonal_closure',
        }}
      />,
    );
    expect(screen.getByLabelText('Potabilité : Indiquée potable, non certifiée')).toBeOnTheScreen();
    expect(screen.getByLabelText('Fonctionnement : Hors service (signalé)')).toBeOnTheScreen();
    expect(screen.getByLabelText('Accès : Fermé pour la saison')).toBeOnTheScreen();
  });
});
