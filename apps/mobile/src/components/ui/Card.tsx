import { View, type ViewProps } from 'react-native';

import { useAppTheme } from '@/theme';

export interface CardProps extends ViewProps {
  elevated?: boolean;
  padded?: boolean;
}

export function Card({ elevated = false, padded = true, style, ...rest }: CardProps) {
  const theme = useAppTheme();
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: elevated ? theme.colors.surfaceElevated : theme.colors.surface,
          borderRadius: theme.radius.lg,
          borderWidth: elevated ? 0 : 1,
          borderColor: theme.colors.border,
          padding: padded ? theme.space.lg : 0,
        },
        elevated && { boxShadow: theme.shadow.md },
        style,
      ]}
    />
  );
}
