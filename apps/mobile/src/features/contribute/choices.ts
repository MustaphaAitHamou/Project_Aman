import type { WaterPointKind, WaterType } from '@water-finder/core';
import type { TFunction } from 'i18next';

import type { Choice } from './ChoiceChips';

export const KIND_CHOICES: readonly WaterPointKind[] = [
  'drinking_fountain',
  'water_tap',
  'bottle_refill_station',
  'spring',
  'well_pump',
  'decorative_fountain',
  'other',
];

export const WATER_TYPES: readonly WaterType[] = [
  'still',
  'sparkling',
  'still_and_sparkling',
  'unknown',
];

export const kindChoices = (t: TFunction): Choice<WaterPointKind>[] =>
  KIND_CHOICES.map((value) => ({ value, label: t(`point.kind.${value}`) }));

export const waterTypeChoices = (t: TFunction): Choice<WaterType>[] =>
  WATER_TYPES.map((value) => ({ value, label: t(`point.waterType.${value}`) }));

/** Oui / Non / Je ne sais pas. */
export const triStateChoices = (t: TFunction): Choice<boolean | null>[] => [
  { value: true, label: t('contribute.yes') },
  { value: false, label: t('contribute.no') },
  { value: null, label: t('contribute.dontKnow') },
];
