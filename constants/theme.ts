/**
 * Theme aggregator — re-exports the split token files so existing
 * `import { Colors, Fonts } from '@/constants/theme'` call sites keep
 * working while new code can import the specific files directly.
 *
 * Adding new tokens? Put them in the domain file
 * (`colors.ts` / `typography.ts` / `spacing.ts`) and re-export here.
 */

export { Colors, Gradients, Palette } from './colors';
export type { ColorScheme, ColorToken, ThemeColors } from './colors';

export { Fonts, Typography } from './typography';
export type { TypographyVariant } from './typography';

export { Spacing, Radius, Elevation } from './spacing';
export type { SpacingKey, RadiusKey } from './spacing';
