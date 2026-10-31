import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useAppTheme } from '@/theme';

import { AppText } from './AppText';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  hint?: string;
  error?: string | null;
}

/** Champ de formulaire avec libellé visible, aide et message d'erreur annoncé. */
export function TextField({ label, hint, error, multiline, ...rest }: TextFieldProps) {
  const theme = useAppTheme();
  const { colors } = theme;

  return (
    <View style={{ gap: theme.space.xs }}>
      <AppText variant="subhead" style={styles.label}>
        {label}
      </AppText>
      <TextInput
        {...rest}
        multiline={multiline}
        accessibilityLabel={label}
        accessibilityHint={hint}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.primary}
        style={[
          styles.input,
          theme.typography.body,
          {
            color: colors.text,
            backgroundColor: colors.surfaceMuted,
            borderColor: error ? colors.danger : colors.borderStrong,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.space.md,
          },
          multiline && styles.multiline,
        ]}
      />
      {error ? (
        <AppText variant="footnote" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="footnote" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontWeight: '600',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    paddingVertical: 10,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
});
