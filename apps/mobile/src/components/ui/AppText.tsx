import { Text, type TextProps } from 'react-native';

import { useAppTheme, type AppTheme, type TypographyVariant } from '@/theme';

export type TextTone =
  'default' | 'secondary' | 'muted' | 'inverse' | 'primary' | 'danger' | 'onPrimary';

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  tone?: TextTone;
  align?: 'auto' | 'left' | 'center' | 'right';
}

function toneColor(theme: AppTheme, tone: TextTone): string {
  switch (tone) {
    case 'secondary':
      return theme.colors.textSecondary;
    case 'muted':
      return theme.colors.textMuted;
    case 'inverse':
      return theme.colors.textInverse;
    case 'primary':
      return theme.colors.primary;
    case 'danger':
      return theme.colors.danger;
    case 'onPrimary':
      return theme.colors.onPrimary;
    default:
      return theme.colors.text;
  }
}

export function AppText({
  variant = 'body',
  tone = 'default',
  align,
  style,
  ...rest
}: AppTextProps) {
  const theme = useAppTheme();
  return (
    <Text
      {...rest}
      style={[
        theme.typography[variant],
        { color: toneColor(theme, tone) },
        align && { textAlign: align },
        style,
      ]}
    />
  );
}
