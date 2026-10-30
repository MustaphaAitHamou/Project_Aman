import { Children, Fragment, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme';

import { AppText } from './AppText';

export interface SectionProps {
  title?: string;
  footer?: string;
  children: ReactNode;
}

/** Groupe de lignes (réglages, menus) avec séparateurs. */
export function Section({ title, footer, children }: SectionProps) {
  const theme = useAppTheme();
  const items = Children.toArray(children).filter(Boolean);

  return (
    <View style={{ gap: theme.space.sm }}>
      {title ? (
        <AppText
          variant="footnote"
          tone="secondary"
          accessibilityRole="header"
          style={[styles.title, { paddingHorizontal: theme.space.lg }]}
        >
          {title}
        </AppText>
      ) : null}
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          overflow: 'hidden',
        }}
      >
        {items.map((child, index) => (
          <Fragment key={index}>
            {index > 0 ? (
              <View
                style={[
                  styles.separator,
                  { backgroundColor: theme.colors.border, marginLeft: theme.space.lg },
                ]}
              />
            ) : null}
            {child}
          </Fragment>
        ))}
      </View>
      {footer ? (
        <AppText variant="footnote" tone="muted" style={{ paddingHorizontal: theme.space.lg }}>
          {footer}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
});
