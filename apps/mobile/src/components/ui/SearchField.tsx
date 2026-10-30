import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useAppTheme } from '@/theme';

import { Icon } from './Icon';

export interface SearchFieldProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (value: string) => void;
  accessibilityLabel: string;
  clearLabel: string;
}

export function SearchField({
  value,
  onChangeText,
  accessibilityLabel,
  clearLabel,
  ...rest
}: SearchFieldProps) {
  const theme = useAppTheme();
  const { colors } = theme;

  return (
    <View
      style={[
        styles.container,
        {
          gap: theme.space.sm,
          paddingHorizontal: theme.space.md,
          borderRadius: theme.radius.md,
          backgroundColor: colors.surfaceMuted,
          borderColor: colors.borderStrong,
        },
      ]}
    >
      <Icon name="magnify" size={22} color={colors.textSecondary} />
      <TextInput
        {...rest}
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel={accessibilityLabel}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.primary}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        style={[styles.input, theme.typography.body, { color: colors.text }]}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={clearLabel}
          hitSlop={12}
          onPress={() => onChangeText('')}
        >
          <Icon name="close-circle-outline" size={20} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 0,
  },
});
