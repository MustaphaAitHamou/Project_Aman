import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Retour haptique léger pour les sélections (sans effet sur le web). */
export function selectionFeedback(): void {
  if (Platform.OS === 'web') return;
  Haptics.selectionAsync().catch(() => undefined);
}

export function impactFeedback(): void {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}
