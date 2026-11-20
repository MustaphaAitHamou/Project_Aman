import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useLoop } from './motion';

// Positions, tailles et rythmes fixes : un décor stable d'un rendu à l'autre.
const BUBBLES = [
  { left: '6%', size: 7, duration: 4600, delay: 0 },
  { left: '17%', size: 11, duration: 5600, delay: 1200 },
  { left: '31%', size: 6, duration: 3900, delay: 2300 },
  { left: '46%', size: 9, duration: 5100, delay: 600 },
  { left: '61%', size: 5, duration: 4300, delay: 1900 },
  { left: '72%', size: 12, duration: 6200, delay: 300 },
  { left: '84%', size: 7, duration: 4800, delay: 2800 },
  { left: '93%', size: 9, duration: 5400, delay: 1500 },
] as const;

function Bubble({
  left,
  size,
  duration,
  delay,
  rise,
  color,
}: (typeof BUBBLES)[number] & { rise: number; color: string }) {
  const progress = useLoop(duration, { delay });
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.15, 0.75, 1], [0, 0.9, 0.6, 0]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -rise]) },
      { translateX: interpolate(progress.value, [0, 0.5, 1], [0, 5, -3]) },
      { scale: interpolate(progress.value, [0, 1], [0.7, 1.1]) },
    ],
  }));
  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          left,
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
        },
        style,
      ]}
    />
  );
}

/** Bulles qui montent et s'évanouissent (décor d'un bandeau ou d'une illustration). */
export function Bubbles({
  rise = 110,
  color = 'rgba(255, 255, 255, 0.75)',
  count = BUBBLES.length,
  style,
}: {
  rise?: number;
  color?: string;
  count?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      {BUBBLES.slice(0, count).map((bubble) => (
        <Bubble key={bubble.left} {...bubble} rise={rise} color={color} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    bottom: 6,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
});
