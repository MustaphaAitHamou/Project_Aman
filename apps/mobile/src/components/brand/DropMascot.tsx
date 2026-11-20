import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { palette } from '@/theme';

import { Drop, DROP_HEIGHT_RATIO } from './Drop';
import { gentle, useLoop } from './motion';
import { Ripples } from './Ripples';

const INK = '#04252F';

/** Paupières : clignement bref toutes les quelques secondes (désactivé si mouvements réduits). */
function useBlink() {
  const reduceMotion = useReducedMotion();
  const open = useSharedValue(1);
  useEffect(() => {
    if (reduceMotion) return;
    open.value = withRepeat(
      withSequence(
        withDelay(3400, withTiming(0.12, { duration: 90 })),
        withTiming(1, { duration: 130 }),
      ),
      -1,
    );
    return () => cancelAnimation(open);
  }, [open, reduceMotion]);
  return open;
}

/** Visage de la mascotte (yeux, joues, sourire), proportionnel à la taille de la goutte. */
function Face({ size }: { size: number }) {
  const open = useBlink();
  const eyeStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: open.value }] }));
  const eye = {
    width: size * 0.085,
    height: size * 0.12,
    borderRadius: size * 0.05,
    backgroundColor: INK,
  };
  return (
    <View style={[styles.face, { marginTop: size * 0.1, gap: size * 0.035 }]}>
      <View style={[styles.row, { gap: size * 0.17 }]}>
        <Animated.View style={[eye, eyeStyle]} />
        <Animated.View style={[eye, eyeStyle]} />
      </View>
      <View style={[styles.row, { gap: size * 0.08, alignItems: 'flex-start' }]}>
        <View style={[styles.cheek, cheekSize(size)]} />
        <View
          style={{
            width: size * 0.2,
            height: size * 0.1,
            borderWidth: size * 0.03,
            borderTopWidth: 0,
            borderColor: INK,
            borderBottomLeftRadius: size * 0.12,
            borderBottomRightRadius: size * 0.12,
          }}
        />
        <View style={[styles.cheek, cheekSize(size)]} />
      </View>
    </View>
  );
}

const cheekSize = (size: number) => ({
  width: size * 0.11,
  height: size * 0.065,
  borderRadius: size * 0.04,
  marginTop: size * 0.01,
});

export interface DropMascotProps {
  /** Largeur de la goutte. */
  size?: number;
  color?: string;
  /** Élément posé contre la goutte (pastille d'icône…), qui flotte avec elle. */
  accessory?: ReactNode;
  /** Ondes au pied de la goutte. */
  ripples?: boolean;
  /** Ombre portée au sol (inutile sur un bandeau coloré). */
  shadow?: boolean;
  ripplesColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * « Goutte », la mascotte de Water Finder : elle flotte, cligne des yeux et fait des ronds dans
 * l'eau. Purement décorative (masquée aux lecteurs d'écran).
 */
export function DropMascot({
  size = 112,
  color = palette.source.vif,
  accessory,
  ripples = true,
  shadow = true,
  ripplesColor = palette.source.vif,
  style,
  testID,
}: DropMascotProps) {
  const float = useLoop(1700, { reverse: true, easing: gentle });
  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(float.value, [0, 1], [0, -size * 0.08]) },
      { rotate: `${interpolate(float.value, [0, 1], [-2.5, 2.5])}deg` },
    ],
  }));
  const shadowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(float.value, [0, 1], [0.28, 0.14]),
    transform: [{ scaleX: interpolate(float.value, [0, 1], [1, 0.75]) }],
  }));
  const height = size * DROP_HEIGHT_RATIO;
  const groundWidth = size * 1.5;

  return (
    <View
      testID={testID}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width: groundWidth, height: height + size * 0.28 }, styles.center, style]}
    >
      {ripples ? (
        <Ripples
          size={groundWidth}
          color={ripplesColor}
          flatten={0.28}
          style={[styles.ground, { bottom: -groundWidth / 2 + size * 0.1 }]}
        />
      ) : null}
      {shadow ? (
        <Animated.View
          style={[
            styles.shadow,
            {
              width: size * 0.56,
              height: size * 0.09,
              borderRadius: size * 0.045,
              bottom: size * 0.05,
              backgroundColor: ripplesColor,
            },
            shadowStyle,
          ]}
        />
      ) : null}
      <Animated.View style={[styles.body, { top: 0 }, bodyStyle]}>
        <Drop size={size} color={color}>
          <Face size={size} />
        </Drop>
        {accessory ? (
          <View style={[styles.accessory, { right: -size * 0.18, top: height * 0.3 }]}>
            {accessory}
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
  },
  body: {
    position: 'absolute',
  },
  face: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cheek: {
    backgroundColor: 'rgba(255, 128, 150, 0.5)',
  },
  shadow: {
    position: 'absolute',
  },
  ground: {
    position: 'absolute',
  },
  accessory: {
    position: 'absolute',
  },
});
