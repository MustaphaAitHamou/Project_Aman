import { darkColors, lightColors, type ColorScheme, type ThemeColors } from './colors';
import { duration, MIN_TOUCH_TARGET, radius, shadow, space } from './tokens';
import { typography } from './typography';

export interface AppTheme {
  scheme: ColorScheme;
  colors: ThemeColors;
  space: typeof space;
  radius: typeof radius;
  typography: typeof typography;
  shadow: (typeof shadow)[ColorScheme];
  duration: typeof duration;
  minTouchTarget: number;
}

function createTheme(scheme: ColorScheme): AppTheme {
  return {
    scheme,
    colors: scheme === 'dark' ? darkColors : lightColors,
    space,
    radius,
    typography,
    shadow: shadow[scheme],
    duration,
    minTouchTarget: MIN_TOUCH_TARGET,
  };
}

export const lightTheme = createTheme('light');
export const darkTheme = createTheme('dark');

export function getTheme(scheme: ColorScheme): AppTheme {
  return scheme === 'dark' ? darkTheme : lightTheme;
}
