import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon, type IconName } from '@/components/ui';
import { selectionFeedback } from '@/lib/haptics';
import { MAX_FONT_SCALE_COMPACT, useAppTheme } from '@/theme';

const TAB_ICONS: Record<string, { icon: IconName; focusedIcon: IconName }> = {
  index: { icon: 'map-outline', focusedIcon: 'map' },
  search: { icon: 'magnify', focusedIcon: 'magnify' },
  add: { icon: 'plus', focusedIcon: 'plus' },
  activity: { icon: 'bell-outline', focusedIcon: 'bell' },
  profile: { icon: 'account-circle-outline', focusedIcon: 'account-circle' },
};

const BAR_HEIGHT = 60;
const ADD_BUTTON_SIZE = 56;

/**
 * Barre d'onglets : CARTE | RECHERCHE | AJOUTER | ACTIVITÉ | PROFIL.
 * Le bouton central « Ajouter » est mis en avant et reste atteignable au pouce.
 */
export function AppTabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  insets,
}: BottomTabBarProps) {
  const theme = useAppTheme();
  const { colors } = theme;

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          minHeight: BAR_HEIGHT + Math.max(insets.bottom, theme.space.sm),
          paddingBottom: Math.max(insets.bottom, theme.space.sm),
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const focused = index === state.index;
        const descriptor = descriptors[route.key];
        const label = descriptor?.options.title ?? route.name;
        const icons = TAB_ICONS[route.name] ?? { icon: 'circle-outline', focusedIcon: 'circle' };
        const isAdd = route.name === 'add';

        const onPress = () => {
          selectionFeedback();
          const event = emitter.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) navigateToTab(route.key);
        };
        const onLongPress = () => emitter.emit({ type: 'tabLongPress', target: route.key });

        return (
          <Pressable
            key={route.key}
            testID={`tab-${route.name}`}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: focused }}
            onPress={onPress}
            onLongPress={onLongPress}
            style={({ pressed }) => [styles.item, { opacity: pressed ? 0.7 : 1 }]}
          >
            {isAdd ? (
              <View
                style={[
                  styles.addButton,
                  {
                    backgroundColor: focused ? colors.primaryPressed : colors.primary,
                    borderColor: colors.tabBar,
                    boxShadow: theme.shadow.md,
                  },
                ]}
              >
                <Icon name="plus" size={30} color={colors.onPrimary} />
              </View>
            ) : (
              <View style={[styles.iconPill, focused && { backgroundColor: colors.primarySoft }]}>
                <Icon
                  name={focused ? icons.focusedIcon : icons.icon}
                  size={24}
                  color={focused ? colors.tabActive : colors.tabInactive}
                />
              </View>
            )}
            <AppText
              variant="caption"
              numberOfLines={1}
              maxFontSizeMultiplier={MAX_FONT_SCALE_COMPACT}
              style={{ color: focused ? colors.tabActive : colors.tabInactive }}
            >
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
  },
  item: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
  },
  iconPill: {
    width: 56,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: ADD_BUTTON_SIZE,
    height: ADD_BUTTON_SIZE,
    borderRadius: ADD_BUTTON_SIZE / 2,
    marginTop: -24,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
