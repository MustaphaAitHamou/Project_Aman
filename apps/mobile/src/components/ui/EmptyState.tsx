import { StyleSheet, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { Drop, DropMascot, gentle, Ripples, useLoop } from '@/components/brand';
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
  /** Mascotte animée (états vides « normaux ») plutôt qu'une simple goutte. */
  mascot?: boolean;
  testID?: string;
}

/** Pastille ronde d'icône, posée contre la mascotte. */
function IconBadge({
  icon,
  background,
  color,
  border,
}: {
  icon: IconName;
  background: string;
  color: string;
  border: string;
}) {
  return (
    <View style={[styles.badge, { backgroundColor: background, borderColor: border }]}>
      <Icon name={icon} size={20} color={color} />
    </View>
  );
}

/** État vide, erreur ou fonctionnalité à venir : toujours une explication et, si possible, une action. */
export function EmptyState({
  icon,
  title,
  body,
  tone = 'info',
  action,
  secondaryAction,
  mascot = false,
  testID,
}: EmptyStateProps) {
  const theme = useAppTheme();
  const palette = theme.colors[tone];

  return (
    <View
      testID={testID}
      style={[styles.container, { gap: theme.space.md, padding: theme.space['2xl'] }]}
    >
      {mascot ? (
        <DropMascot
          size={84}
          ripplesColor={theme.colors.primary}
          accessory={
            <IconBadge
              icon={icon}
              background={palette.soft}
              color={palette.onSoft}
              border={theme.colors.background}
            />
          }
        />
      ) : (
        <View style={styles.dropStage}>
          <Ripples size={132} color={palette.base} count={2} duration={3000} />
          <Drop size={64} color={palette.soft} style={styles.dropOnStage}>
            <Icon name={icon} size={28} color={palette.onSoft} />
          </Drop>
        </View>
      )}
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

/** Goutte qui rebondit au-dessus de ses ondes : indicateur de chargement de la marque. */
function DropLoader() {
  const theme = useAppTheme();
  const bounce = useLoop(520, { reverse: true, easing: gentle });
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(bounce.value, [0, 1], [0, -14]) }],
  }));
  return (
    <View style={styles.loaderStage}>
      <Ripples
        size={96}
        color={theme.colors.primary}
        count={2}
        duration={1040}
        flatten={0.3}
        style={styles.loaderRipples}
      />
      <Animated.View style={style}>
        <Drop size={34} color={theme.colors.primary} />
      </Animated.View>
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
      <DropLoader />
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
  dropStage: {
    width: 132,
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropOnStage: {
    position: 'absolute',
    top: 22,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderStage: {
    width: 96,
    height: 72,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 18,
  },
  loaderRipples: {
    position: 'absolute',
    bottom: -38,
  },
  body: {
    maxWidth: 420,
  },
  actions: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
});
