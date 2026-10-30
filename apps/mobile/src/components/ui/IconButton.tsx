import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { selectionFeedback } from '@/lib/haptics';
import { useAppTheme } from '@/theme';

import { Icon, type IconName } from './Icon';

export interface IconButtonProps {
  icon: IconName;
  /** Obligatoire : l'icône seule n'est pas lisible par les lecteurs d'écran. */
  accessibilityLabel: string;
  onPress: () => void;
  variant?: 'floating' | 'plain' | 'tinted';
  size?: number;
  iconColor?: string;
  badge?: number;
  disabled?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  variant = 'floating',
  size = 48,
  iconColor,
  badge,
  disabled,
  testID,
  style,
}: IconButtonProps) {
  const theme = useAppTheme();
  const { colors } = theme;
  const hitSlop = Math.max(0, (theme.minTouchTarget - size) / 2);

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={() => {
        selectionFeedback();
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
        variant === 'floating' && {
          backgroundColor: pressed ? colors.surfaceMuted : colors.surfaceElevated,
          boxShadow: theme.shadow.md,
        },
        variant === 'tinted' && {
          backgroundColor: pressed ? colors.primarySoft : colors.surfaceMuted,
        },
        variant === 'plain' && pressed && { backgroundColor: colors.surfaceMuted },
        disabled && styles.disabled,
        style,
      ]}
    >
      <Icon name={icon} size={Math.round(size * 0.5)} color={iconColor ?? colors.primary} />
      {badge ? (
        <View
          style={[styles.badge, { backgroundColor: colors.primary, borderColor: colors.surface }]}
          accessible={false}
        >
          <Icon name="circle" size={6} color={colors.onPrimary} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
