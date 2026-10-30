import { StyleSheet, Switch, View } from 'react-native';

import { useAppTheme } from '@/theme';

import { AppText } from './AppText';

export interface ToggleRowProps {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  testID?: string;
}

export function ToggleRow({ label, hint, value, onValueChange, testID }: ToggleRowProps) {
  const theme = useAppTheme();
  return (
    <View style={[styles.row, { gap: theme.space.md, paddingHorizontal: theme.space.lg }]}>
      <View style={styles.texts}>
        <AppText variant="callout">{label}</AppText>
        {hint ? (
          <AppText variant="footnote" tone="muted">
            {hint}
          </AppText>
        ) : null}
      </View>
      <Switch
        testID={testID}
        accessibilityLabel={label}
        accessibilityHint={hint}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: theme.colors.primary, false: theme.colors.borderStrong }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={theme.colors.borderStrong}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
});
