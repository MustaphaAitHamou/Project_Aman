import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

/** Hauteur d'une goutte de largeur 1 : demi-disque (0,5) + pointe (√2 / 2). */
export const DROP_HEIGHT_RATIO = 0.5 + Math.SQRT1_2;

export interface DropProps {
  /** Largeur de la goutte (diamètre de sa partie ronde). */
  size: number;
  color: string;
  /** Reflet clair en haut à gauche. */
  highlight?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Contenu centré dans la partie ronde (icône, visage). */
  children?: ReactNode;
}

/**
 * Goutte de la DA : un carré tourné de 45°, trois coins ronds et un coin vif, la pointe en haut.
 * Dessinée avec de simples vues (aucune dépendance graphique native).
 */
export function Drop({ size, color, highlight = true, style, children }: DropProps) {
  const tip = size * (Math.SQRT1_2 - 0.5);
  return (
    <View style={[{ width: size, height: size * DROP_HEIGHT_RATIO }, style]}>
      <View
        style={[
          styles.square,
          {
            top: tip,
            width: size,
            height: size,
            backgroundColor: color,
            borderRadius: size / 2,
            borderTopLeftRadius: size * 0.06,
          },
        ]}
      />
      {highlight ? (
        <View
          style={[
            styles.highlight,
            {
              left: size * 0.2,
              top: tip + size * 0.2,
              width: size * 0.15,
              height: size * 0.26,
              borderRadius: size * 0.08,
            },
          ]}
        />
      ) : null}
      <View style={[styles.content, { top: tip, width: size, height: size }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  square: {
    position: 'absolute',
    left: 0,
    transform: [{ rotate: '45deg' }],
  },
  highlight: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
    transform: [{ rotate: '24deg' }],
  },
  content: {
    position: 'absolute',
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
