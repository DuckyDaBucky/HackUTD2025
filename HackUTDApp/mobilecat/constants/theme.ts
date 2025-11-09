/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const sharedPalette = {
  text: 'rgba(236, 240, 255, 0.94)',
  textMuted: 'rgba(204, 214, 244, 0.7)',
  background: '#0b0d14',
  surface: 'rgba(18, 24, 36, 0.72)',
  surfaceElevated: 'rgba(18, 24, 36, 0.58)',
  surfaceSecondary: 'rgba(14, 18, 28, 0.68)',
  border: 'rgba(255, 255, 255, 0.08)',
  glow: 'rgba(120, 166, 255, 0.25)',
  glass: 'rgba(255, 255, 255, 0.12)',
  accentPrimary: '#78a6ff',
  accentSecondary: '#6cf9c0',
  accentTertiary: '#74d4ff',
  accentSuccess: '#61f4b4',
  accentWarning: '#fca34c',
  accentDanger: '#ff6484',
  tint: '#78a6ff',
  icon: '#8da0ff',
  iconMuted: '#46506c',
  tabIconDefault: '#46506c',
  tabIconSelected: '#78a6ff',
};

export const Colors = {
  light: { ...sharedPalette },
  dark: { ...sharedPalette },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
