/**
 * Typography scale — system fonts with explicit size/weight per role.
 *
 * We stay on system fonts for now (no custom font loading gate in
 * `_layout.tsx`). If a custom display face is added later, swap
 * `fontFamily` here and the rest of the app picks it up.
 */

import { Platform, TextStyle } from 'react-native';

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
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
})!;

type Variant = TextStyle;

export const Typography = {
  displayLarge: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  displayMedium: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  heading: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subheading: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodyMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  bodySemibold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  captionStrong: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  button: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
  },
  buttonSmall: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  mono: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Fonts.mono,
  },
} satisfies Record<string, Variant>;

export type TypographyVariant = keyof typeof Typography;
