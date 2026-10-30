import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';

import { useAppTheme } from '@/theme';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

/** Icône décorative : masquée aux lecteurs d'écran (le libellé est porté par le parent). */
export function Icon({ name, size = 24, color }: IconProps) {
  const theme = useAppTheme();
  return (
    <MaterialCommunityIcons
      name={name}
      size={size}
      color={color ?? theme.colors.text}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      aria-hidden
    />
  );
}
