import { StyleSheet, View } from 'react-native';

import { AppText, Chip, type IconName } from '@/components/ui';
import { useAppTheme } from '@/theme';

export interface Choice<T> {
  value: T;
  label: string;
  icon?: IconName;
}

/** Choix unique parmi des pastilles (s'adapte à la largeur, contrairement à un segmenté). */
export function ChoiceChips<T extends string | boolean | null>({
  label,
  choices,
  value,
  onChange,
  testID,
}: {
  label: string;
  choices: readonly Choice<T>[];
  value: T;
  onChange: (value: T) => void;
  testID?: string;
}) {
  const theme = useAppTheme();
  return (
    <View style={{ gap: theme.space.sm }} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <AppText variant="subhead" style={styles.label}>
        {label}
      </AppText>
      <View style={[styles.row, { gap: theme.space.sm }]}>
        {choices.map((choice) => (
          <Chip
            key={String(choice.value)}
            testID={testID ? `${testID}-${String(choice.value)}` : undefined}
            label={choice.label}
            icon={choice.icon}
            selected={choice.value === value}
            onPress={() => onChange(choice.value)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
