import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useLoop } from './motion';

/** Largeur couverte par une couche (écrans de téléphone, tablette et aperçu web). */
const MAX_WIDTH = 1600;

function WaveLayer({
  color,
  period,
  top,
  duration,
  direction,
}: {
  color: string;
  period: number;
  top: number;
  duration: number;
  direction: 1 | -1;
}) {
  const progress = useLoop(duration);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [0, direction * period]) }],
  }));
  // Grands cercles qui se chevauchent : leurs sommets forment une houle douce (amplitude ≈ 11 % de
  // la période, creux peu marqués) ; un aplat comble le dessous.
  const diameter = period * 2.4;
  const count = Math.ceil(MAX_WIDTH / period) + 3;
  return (
    <Animated.View
      style={[styles.layer, { top, left: -period * 1.5, width: count * period }, style]}
    >
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          style={{
            position: 'absolute',
            left: index * period - (diameter - period) / 2,
            top: 0,
            width: diameter,
            height: diameter,
            borderRadius: diameter / 2,
            backgroundColor: color,
          }}
        />
      ))}
      <View
        style={[styles.fill, { top: diameter / 2, height: diameter, backgroundColor: color }]}
      />
    </Animated.View>
  );
}

/**
 * Bord de vagues animé : deux houles qui se croisent (arrière plus claire, avant opaque).
 * Placé au bas d'un bandeau, la couleur avant égale au fond de page, il « fond » dans l'écran.
 */
export function Waves({
  color,
  backColor,
  height = 22,
  period = 88,
  duration = 5200,
  style,
}: {
  color: string;
  backColor?: string;
  height?: number;
  period?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View pointerEvents="none" style={[{ height }, styles.clip, style]}>
      {backColor ? (
        <WaveLayer
          color={backColor}
          period={period * 1.25}
          top={0}
          duration={duration * 1.5}
          direction={1}
        />
      ) : null}
      <WaveLayer
        color={color}
        period={period}
        top={height * 0.38}
        duration={duration}
        direction={-1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  layer: {
    position: 'absolute',
    height: 400,
  },
  fill: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
