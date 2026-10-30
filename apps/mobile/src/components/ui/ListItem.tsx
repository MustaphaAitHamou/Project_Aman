import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  iconColor?: string;
  /** Valeur affichée à droite (ex. réglage courant). */
  value?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  accessibilityHint?: string;
  testID?: string;
}

export function ListItem({
  title,
  subtitle,
  icon,
  iconColor,
  value,
  trailing,
  onPress,
  showChevron = !!onPress,
  accessibilityHint,
  testID,
}: ListItemProps) {
  const theme = useAppTheme();
  const { colors } = theme;

  const content = (
    <>
      {icon ? (
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: colors.primarySoft, borderRadius: theme.radius.md },
          ]}
        >
          <Icon name={icon} size={22} color={iconColor ?? colors.onPrimarySoft} />
        </View>
      ) : null}
      <View style={styles.texts}>
        <AppText variant="headline">{title}</AppText>
        {subtitle ? (
          <AppText variant="subhead" tone="secondary">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant="subhead" tone="secondary" style={styles.value}>
          {value}
        </AppText>
      ) : null}
      {trailing}
      {showChevron ? <Icon name="chevron-right" size={24} color={colors.textMuted} /> : null}
    </>
  );

  const containerStyle = [styles.row, { gap: theme.space.md, paddingHorizontal: theme.space.lg }];

  if (!onPress) {
    return (
      <View
        testID={testID}
        style={containerStyle}
        accessible
        accessibilityLabel={[title, subtitle, value].filter(Boolean).join(', ')}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={[title, subtitle, value].filter(Boolean).join(', ')}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [containerStyle, pressed && { backgroundColor: colors.surfaceMuted }]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  value: {
    maxWidth: '45%',
    textAlign: 'right',
  },
});
