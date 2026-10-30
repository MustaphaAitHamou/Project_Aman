import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme';

import { AppText } from './AppText';
import { Button, type ButtonProps } from './Button';
import { Icon, type IconName } from './Icon';
import type { StatusTone } from './StatusBadge';

export interface EmptyStateProps {
  icon: IconName;
  title: string;
  body?: string;
  tone?: StatusTone;
  action?: Pick<ButtonProps, 'label' | 'onPress' | 'icon' | 'variant'>;
  secondaryAction?: Pick<ButtonProps, 'label' | 'onPress' | 'icon'>;
  testID?: string;
}

/** État vide, erreur ou fonctionnalité à venir : toujours une explication et, si possible, une action. */
export function EmptyState({
  icon,
  title,
  body,
  tone = 'info',
  action,
  secondaryAction,
  testID,
}: EmptyStateProps) {
  const theme = useAppTheme();
  const palette = theme.colors[tone];

  return (
    <View
      testID={testID}
      style={[styles.container, { gap: theme.space.md, padding: theme.space['2xl'] }]}
    >
      <View style={[styles.iconCircle, { backgroundColor: palette.soft }]}>
        <Icon name={icon} size={36} color={palette.onSoft} />
      </View>
      <AppText variant="title3" align="center" accessibilityRole="header">
        {title}
      </AppText>
      {body ? (
        <AppText variant="callout" tone="secondary" align="center" style={styles.body}>
          {body}
        </AppText>
      ) : null}
      {action || secondaryAction ? (
        <View style={[styles.actions, { gap: theme.space.sm, marginTop: theme.space.sm }]}>
          {action ? <Button {...action} /> : null}
          {secondaryAction ? <Button {...secondaryAction} variant="ghost" /> : null}
        </View>
      ) : null}
    </View>
  );
}

export function LoadingState({ label }: { label: string }) {
  const theme = useAppTheme();
  return (
    <View
      style={[styles.container, { gap: theme.space.md, padding: theme.space['2xl'] }]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
    >
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <AppText variant="callout" tone="secondary" align="center">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    maxWidth: 420,
  },
  actions: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
});
