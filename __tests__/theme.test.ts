import { Colors, Gradients, Palette, Spacing, Radius, Elevation, Fonts, Typography } from '../constants/theme';

describe('theme constants', () => {
  it('exports light and dark color schemes', () => {
    expect(Colors.light).toBeDefined();
    expect(Colors.dark).toBeDefined();
    expect(Colors.light.primary).toBeDefined();
    expect(Colors.dark.primary).toBeDefined();
  });

  it('exports palette with brand colors', () => {
    expect(Palette).toBeDefined();
    expect(Palette.violet).toBeDefined();
    expect(Palette.violet[500]).toBeDefined();
  });

  it('exports gradients', () => {
    expect(Gradients).toBeDefined();
    expect(Gradients.brand).toBeDefined();
    expect(Gradients.ctaButton).toBeDefined();
  });

  it('exports spacing tokens', () => {
    expect(Spacing.xs).toBeDefined();
    expect(Spacing.sm).toBeDefined();
    expect(Spacing.md).toBeDefined();
    expect(Spacing.lg).toBeDefined();
    expect(Spacing.xl).toBeDefined();
  });

  it('exports radius tokens', () => {
    expect(Radius.sm).toBeDefined();
    expect(Radius.md).toBeDefined();
    expect(Radius.lg).toBeDefined();
  });

  it('exports elevation tokens', () => {
    expect(Elevation).toBeDefined();
  });

  it('exports font families', () => {
    expect(Fonts).toBeDefined();
  });

  it('exports typography variants', () => {
    expect(Typography.displayLarge).toBeDefined();
    expect(Typography.heading).toBeDefined();
    expect(Typography.body).toBeDefined();
    expect(Typography.label).toBeDefined();
    expect(Typography.button).toBeDefined();
  });
});
