import { Pressable, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import type { StatusTone } from './StatusBadge';

export interface BannerProps {
  tone: StatusTone;
  message: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
  /** Annonce le message aux lecteurs d'écran dès son apparition. */
  live?: boolean;
  testID?: string;
}

const DEFAULT_ICONS: Record<StatusTone, IconName> = {
  success: 'check-circle-outline',
  warning: 'alert-outline',
  error: 'alert-circle-outline',
  neutral: 'information-outline',
  info: 'information-outline',
};

export function Banner({
  tone,
  message,
  icon,
  actionLabel,
  onAction,
  live = true,
  testID,
}: BannerProps) {
  const theme = useAppTheme();
  const palette = theme.colors[tone];

  return (
    <View
      testID={testID}
      accessibilityLiveRegion={live ? 'polite' : 'none'}
      style={[
        styles.base,
        {
          backgroundColor: palette.soft,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.space.md,
          gap: theme.space.sm,
          boxShadow: theme.shadow.sm,
        },
      ]}
    >
      <Icon name={icon ?? DEFAULT_ICONS[tone]} size={20} color={palette.onSoft} />
      <AppText variant="subhead" style={[styles.message, { color: palette.onSoft }]}>
        {message}
      </AppText>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          hitSlop={8}
          onPress={onAction}
          style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}
        >
          <AppText variant="label" style={[styles.actionLabel, { color: palette.onSoft }]}>
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingVertical: 8,
  },
  message: {
    flex: 1,
  },
  action: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  actionLabel: {
    textDecorationLine: 'underline',
  },
});
