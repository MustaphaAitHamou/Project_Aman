import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useLoop } from './motion';

function Ring({
  size,
  color,
  delay,
  duration,
  flatten,
}: {
  size: number;
  color: string;
  delay: number;
  duration: number;
  flatten: number;
}) {
  const progress = useLoop(duration, { delay });
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.15, 1], [0, 0.65, 0]),
    transform: [{ scaleY: flatten }, { scale: interpolate(progress.value, [0, 1], [0.45, 1]) }],
  }));
  return (
    <Animated.View
      style={[
        styles.ring,
        { width: size, height: size, borderRadius: size / 2, borderColor: color },
        style,
      ]}
    />
  );
}

/**
 * Ondes concentriques qui s'élargissent, comme une goutte tombée dans l'eau.
 * `flatten` < 1 donne des ellipses (ondes vues en perspective, au pied d'une goutte).
 */
export function Ripples({
  size,
  color,
  count = 3,
  duration = 2600,
  flatten = 1,
  style,
}: {
  size: number;
  color: string;
  count?: number;
  duration?: number;
  flatten?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View pointerEvents="none" style={[{ width: size, height: size }, styles.center, style]}>
      {Array.from({ length: count }, (_, index) => (
        <Ring
          key={index}
          size={size}
          color={color}
          duration={duration}
          delay={(duration / count) * index}
          flatten={flatten}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
  },
});
