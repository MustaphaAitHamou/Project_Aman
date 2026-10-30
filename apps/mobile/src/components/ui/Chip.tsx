import { Pressable, StyleSheet } from 'react-native';

import { selectionFeedback } from '@/lib/haptics';
import { useAppTheme, MAX_FONT_SCALE_COMPACT } from '@/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export interface ChipProps {
  label: string;
  onPress: () => void;
  selected?: boolean;
  icon?: IconName;
  /** Affiche une croix : la chip retire un filtre actif. */
  removable?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

export function Chip({
  label,
  onPress,
  selected = false,
  icon,
  removable,
  accessibilityLabel,
  testID,
}: ChipProps) {
  const theme = useAppTheme();
  const { colors } = theme;
  const foreground = selected ? colors.onPrimarySoft : colors.text;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      hitSlop={6}
      onPress={() => {
        selectionFeedback();
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        {
          gap: theme.space.xs,
          paddingHorizontal: theme.space.md,
          borderRadius: theme.radius.pill,
          backgroundColor: selected ? colors.primarySoft : colors.surfaceElevated,
          borderColor: selected ? colors.primary : colors.border,
          boxShadow: theme.shadow.sm,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {icon ? <Icon name={icon} size={16} color={foreground} /> : null}
      <AppText
        variant="label"
        style={{ color: foreground }}
        maxFontSizeMultiplier={MAX_FONT_SCALE_COMPACT}
      >
        {label}
      </AppText>
      {removable ? <Icon name="close" size={16} color={foreground} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
});
