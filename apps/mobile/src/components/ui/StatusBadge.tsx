import { StyleSheet, View } from 'react-native';

import { MAX_FONT_SCALE_COMPACT, useAppTheme } from '@/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export type StatusTone = 'success' | 'warning' | 'error' | 'neutral' | 'info';

export interface StatusBadgeProps {
  tone: StatusTone;
  label: string;
  icon?: IconName;
  testID?: string;
}

/** Badge de statut : la couleur n'est jamais le seul porteur d'information (icône + texte). */
export function StatusBadge({ tone, label, icon, testID }: StatusBadgeProps) {
  const theme = useAppTheme();
  const palette = theme.colors[tone];
  return (
    <View
      testID={testID}
      style={[
        styles.base,
        {
          backgroundColor: palette.soft,
          borderRadius: theme.radius.pill,
          paddingHorizontal: theme.space.sm,
          gap: theme.space.xs,
        },
      ]}
    >
      {icon ? <Icon name={icon} size={16} color={palette.onSoft} /> : null}
      <AppText
        variant="footnote"
        style={[styles.label, { color: palette.onSoft }]}
        maxFontSizeMultiplier={MAX_FONT_SCALE_COMPACT}
      >
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 28,
    paddingVertical: 4,
  },
  label: {
    fontWeight: '600',
    flexShrink: 1,
  },
});
