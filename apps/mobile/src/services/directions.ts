import { buildDirectionsUrl, type Coordinates } from '@water-finder/core';
import type { TFunction } from 'i18next';
import { ActionSheetIOS, Alert, Linking, Platform } from 'react-native';

async function openUrl(url: string, t: TFunction): Promise<void> {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(t('common.openLinkError'));
  }
}

/**
 * Ouvre l'itinéraire piéton dans l'application de cartographie de l'utilisateur.
 * iOS : choix entre Plans et Google Maps ; Android et web : Google Maps (application ou site).
 */
export function openDirections(destination: Coordinates, t: TFunction): void {
  if (Platform.OS === 'ios') {
    const options = [t('point.appleMaps'), t('point.googleMaps'), t('common.cancel')];
    ActionSheetIOS.showActionSheetWithOptions(
      { title: t('point.directionsWith'), options, cancelButtonIndex: 2 },
      (index) => {
        if (index === 0) void openUrl(buildDirectionsUrl(destination, 'apple'), t);
        if (index === 1) void openUrl(buildDirectionsUrl(destination, 'google'), t);
      },
    );
    return;
  }
  void openUrl(buildDirectionsUrl(destination, 'google'), t);
}
