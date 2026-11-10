/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const AbambaColors = {
  primary: '#003459',
  primaryDark: '#00253F',
  primaryLight: '#004A7F',
  secondaryLight: '#FCEED5',
  secondaryDark: '#FFE7BA',
  accent: '#FF5500',
  accentDark: '#E04B00',
  textDark: '#003459',
  textBody: '#4B5563',
  textMuted: '#9CA3AF',
  background: '#FFFFFF',
  backgroundBars: '#F3F9FB',
  cardBackground: '#FFFFFF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
};

export const Colors = {
  light: {
    primary: '#003459',
    text: '#003459',
    background: '#ffffff',
    backgroundElement: '#F3F9FB',
    backgroundSelected: '#E0E7EC',
    textSecondary: '#64748B',
    tint: '#003459',
  },
  dark: {
    primary: '#003459',
    text: '#ffffff',
    background: '#001A2C',
    backgroundElement: '#00253F',
    backgroundSelected: '#003459',
    textSecondary: '#94A3B8',
    tint: '#38BDF8',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

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
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
