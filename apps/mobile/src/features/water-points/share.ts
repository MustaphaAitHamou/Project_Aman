import { buildDirectionsUrl, type Coordinates } from '@water-finder/core';
import * as Linking from 'expo-linking';
import type { TFunction } from 'i18next';
import { Share } from 'react-native';

/** Texte de partage : nom, lien d'ouverture dans l'application et lien de carte universel. */
export function buildShareMessage(
  point: { id: string; name: string | null; kindLabel: string; location: Coordinates },
  t: TFunction,
  appLink: string = Linking.createURL(`/point/${point.id}`),
): string {
  return t('pointDetail.shareMessage', {
    name: point.name ?? point.kindLabel,
    mapUrl: buildDirectionsUrl(point.location, 'google'),
    appUrl: appLink,
  });
}

export async function sharePoint(
  point: { id: string; name: string | null; kindLabel: string; location: Coordinates },
  t: TFunction,
): Promise<void> {
  await Share.share({ message: buildShareMessage(point, t) }).catch(() => undefined);
}
