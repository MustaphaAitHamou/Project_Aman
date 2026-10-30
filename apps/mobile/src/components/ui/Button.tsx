import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { impactFeedback } from '@/lib/haptics';
import { useAppTheme, type AppTheme } from '@/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: 'md' | 'lg';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityHint?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

function variantColors(theme: AppTheme, variant: ButtonVariant, pressed: boolean) {
  const { colors } = theme;
  switch (variant) {
    case 'secondary':
      return {
        background: pressed ? colors.primarySoft : colors.surface,
        foreground: colors.primary,
        border: colors.borderStrong,
      };
    case 'ghost':
      return {
        background: pressed ? colors.surfaceMuted : 'transparent',
        foreground: colors.primary,
        border: 'transparent',
      };
    case 'danger':
      return { background: colors.danger, foreground: colors.onDanger, border: colors.danger };
    default:
      return {
        background: pressed ? colors.primaryPressed : colors.primary,
        foreground: colors.onPrimary,
        border: pressed ? colors.primaryPressed : colors.primary,
      };
  }
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  accessibilityHint,
  testID,
  style,
}: ButtonProps) {
  const theme = useAppTheme();
  const inactive = disabled || loading;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={() => {
        impactFeedback();
        onPress();
      }}
      style={({ pressed }) => {
        const palette = variantColors(theme, variant, pressed);
        return [
          styles.base,
          {
            minHeight: size === 'lg' ? 56 : theme.minTouchTarget,
            paddingHorizontal: size === 'lg' ? theme.space['2xl'] : theme.space.xl,
            borderRadius: theme.radius.md,
            backgroundColor: palette.background,
            borderColor: palette.border,
            opacity: inactive ? 0.55 : 1,
          },
          fullWidth && styles.fullWidth,
          style,
        ];
      }}
    >
      {({ pressed }) => {
        const palette = variantColors(theme, variant, pressed);
        return (
          <View style={[styles.content, { gap: theme.space.sm }]}>
            {loading ? (
              <ActivityIndicator color={palette.foreground} />
            ) : (
              icon && <Icon name={icon} size={20} color={palette.foreground} />
            )}
            <AppText
              variant="label"
              style={{ color: palette.foreground }}
              numberOfLines={2}
              align="center"
            >
              {label}
            </AppText>
          </View>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
