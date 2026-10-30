import { Pressable, StyleSheet, View } from 'react-native';

import { selectionFeedback } from '@/lib/haptics';
import { MAX_FONT_SCALE_COMPACT, useAppTheme } from '@/theme';

import { AppText } from './AppText';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
  testID?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  testID,
}: SegmentedControlProps<T>) {
  const theme = useAppTheme();
  const { colors } = theme;

  return (
    <View
      testID={testID}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.track,
        { backgroundColor: colors.surfaceMuted, borderRadius: theme.radius.md },
      ]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            testID={testID ? `${testID}-${option.value}` : undefined}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: selected, selected }}
            onPress={() => {
              if (selected) return;
              selectionFeedback();
              onChange(option.value);
            }}
            style={[
              styles.segment,
              { borderRadius: theme.radius.sm },
              selected && { backgroundColor: colors.surfaceElevated, boxShadow: theme.shadow.sm },
            ]}
          >
            <AppText
              variant="label"
              align="center"
              numberOfLines={1}
              maxFontSizeMultiplier={MAX_FONT_SCALE_COMPACT}
              style={{ color: selected ? colors.primary : colors.textSecondary }}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
});
