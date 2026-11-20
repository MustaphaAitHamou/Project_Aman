import { useEffect } from 'react';
import {
  cancelAnimation,
  Easing,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  type EasingFunction,
  type SharedValue,
} from 'react-native-reanimated';

/**
 * Progression 0 → 1 répétée à l'infini (aller-retour si `reverse`), pour les animations
 * décoratives. Figée à 0 quand l'utilisateur a demandé à réduire les animations.
 */
export function useLoop(
  duration: number,
  options: { delay?: number; reverse?: boolean; easing?: EasingFunction } = {},
): SharedValue<number> {
  const { delay = 0, reverse = false, easing = Easing.linear } = options;
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 0;
      return;
    }
    progress.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing }), -1, reverse));
    return () => cancelAnimation(progress);
  }, [delay, duration, easing, progress, reduceMotion, reverse]);

  return progress;
}

/** Courbe douce pour les flottements (aller-retour). */
export const gentle = Easing.inOut(Easing.sin);
