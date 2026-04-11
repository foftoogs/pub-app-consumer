/**
 * Branded colour palette for NitePool.
 *
 * Direction: deep purple → magenta gradient primary + pink-coral-orange secondary.
 * Evokes nightlife energy while staying legible on functional screens.
 *
 * Light and dark objects must share the same keys — `useThemeColor`
 * relies on `keyof typeof Colors.light & keyof typeof Colors.dark`.
 */

export const Palette = {
  violet: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6',
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#3F1B7A',
  },
  coral: {
    300: '#FFB3B6',
    400: '#FF8A8E',
    500: '#FF6B70',
    600: '#FF5A5F',
    700: '#E63E45',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAF9',
    100: '#F5F5F4',
    200: '#E7E5E4',
    300: '#D6D3D1',
    400: '#A8A29E',
    500: '#78716C',
    600: '#57534E',
    700: '#44403C',
    800: '#292524',
    900: '#1C1917',
  },
  midnight: {
    50: '#E9E5F2',
    100: '#C9C0E0',
    500: '#3A2E5C',
    700: '#1F1636',
    800: '#17102A',
    900: '#0B0614',
  },
  success: '#10B981',
  successDark: '#34D399',
  warning: '#F59E0B',
  warningDark: '#FBBF24',
  error: '#EF4444',
  errorDark: '#F87171',
} as const;

/** Gradient presets used on auth screens and branded surfaces. */
export const Gradients = {
  /** Deep purple → magenta background (matches NitePool brand). */
  brand: ['#3B0764', '#7C3AED', '#C026D3'] as const,
  /** Pink → orange CTA button. */
  ctaButton: ['#EC4899', '#F97316'] as const,
  /** Subtle violet wash for card overlays. */
  cardOverlay: ['rgba(124, 58, 237, 0.08)', 'rgba(192, 38, 211, 0.04)'] as const,
} as const;

export const Colors = {
  light: {
    // Brand
    primary: Palette.violet[600],
    primaryMuted: Palette.violet[400],
    primarySurface: Palette.violet[50],
    secondary: Palette.coral[600],
    secondaryMuted: Palette.coral[400],

    // Surfaces
    background: Palette.neutral[50],
    surface: Palette.neutral[0],
    surfaceAlt: Palette.violet[50],
    surfacePressed: Palette.violet[100],
    border: Palette.neutral[200],
    borderStrong: Palette.neutral[300],
    overlay: 'rgba(11, 6, 20, 0.45)',

    // Text
    text: '#0F0720',
    textSecondary: Palette.neutral[600],
    textMuted: Palette.neutral[400],
    textOnPrimary: Palette.neutral[0],
    textOnSecondary: Palette.neutral[0],

    // Status
    success: Palette.success,
    warning: Palette.warning,
    error: Palette.error,
    info: Palette.violet[500],

    // Tab bar (consumed by TOO-40)
    tabBarBackground: 'rgba(255, 255, 255, 0.85)',
    tabBarBorder: Palette.neutral[200],
    tabBarActive: Palette.violet[600],
    tabBarInactive: Palette.neutral[400],
    tabBarIndicator: Palette.violet[600],

    // Live mode accent (TOO-44)
    live: Palette.coral[600],
    liveGlow: 'rgba(255, 90, 95, 0.25)',

    // Legacy aliases — kept so existing `useThemeColor(..., 'tint' | 'icon' | ...)`
    // call sites continue to resolve. Prefer the named tokens above for new code.
    tint: Palette.violet[600],
    icon: Palette.neutral[500],
    tabIconDefault: Palette.neutral[400],
    tabIconSelected: Palette.violet[600],
  },
  dark: {
    // Brand
    primary: Palette.violet[400],
    primaryMuted: Palette.violet[600],
    primarySurface: Palette.midnight[700],
    secondary: Palette.coral[500],
    secondaryMuted: Palette.coral[400],

    // Surfaces
    background: Palette.midnight[900],
    surface: Palette.midnight[800],
    surfaceAlt: Palette.midnight[700],
    surfacePressed: Palette.midnight[500],
    border: '#2D2145',
    borderStrong: '#3A2E5C',
    overlay: 'rgba(0, 0, 0, 0.65)',

    // Text
    text: Palette.violet[50],
    textSecondary: Palette.violet[300],
    textMuted: '#8B80A8',
    textOnPrimary: Palette.midnight[900],
    textOnSecondary: Palette.neutral[0],

    // Status
    success: Palette.successDark,
    warning: Palette.warningDark,
    error: Palette.errorDark,
    info: Palette.violet[400],

    // Tab bar
    tabBarBackground: 'rgba(23, 16, 42, 0.85)',
    tabBarBorder: '#2D2145',
    tabBarActive: Palette.violet[400],
    tabBarInactive: '#8B80A8',
    tabBarIndicator: Palette.violet[400],

    // Live mode accent
    live: Palette.coral[500],
    liveGlow: 'rgba(255, 107, 112, 0.3)',

    // Legacy aliases
    tint: Palette.violet[400],
    icon: '#8B80A8',
    tabIconDefault: '#8B80A8',
    tabIconSelected: Palette.violet[400],
  },
} as const;

export type ColorScheme = keyof typeof Colors;
export type ColorToken = keyof typeof Colors.light & keyof typeof Colors.dark;
export type ThemeColors = (typeof Colors)[ColorScheme];
