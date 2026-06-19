import { Colors, Spacing, Radius, Shadows } from '@/constants/theme';

// ── Colors ─────────────────────────────────────────────────────

describe('Colors', () => {
  it('light and dark themes share the same set of keys', () => {
    const lightKeys = Object.keys(Colors.light).sort();
    const darkKeys = Object.keys(Colors.dark).sort();
    expect(lightKeys).toEqual(darkKeys);
  });

  it('all color values are non-empty strings', () => {
    for (const theme of [Colors.light, Colors.dark] as const) {
      for (const [key, value] of Object.entries(theme)) {
        expect(typeof value).toBe('string');
        expect((value as string).length).toBeGreaterThan(0);
      }
    }
  });

  it('light background is white (#ffffff)', () => {
    expect(Colors.light.background).toBe('#ffffff');
  });

  it('dark background is black (#000000)', () => {
    expect(Colors.dark.background).toBe('#000000');
  });

  it('primary color is consistent across themes', () => {
    expect(Colors.light.primary).toBe(Colors.dark.primary);
  });

  it('splash theme has expected keys', () => {
    expect(Colors.splash).toHaveProperty('bgDark');
    expect(Colors.splash).toHaveProperty('green');
    expect(Colors.splash).toHaveProperty('white');
  });

  it('warning, danger, info, success are shared between themes', () => {
    expect(Colors.light.warning).toBe(Colors.dark.warning);
    expect(Colors.light.danger).toBe(Colors.dark.danger);
    expect(Colors.light.info).toBe(Colors.dark.info);
    expect(Colors.light.success).toBe(Colors.dark.success);
  });
});

// ── Spacing ────────────────────────────────────────────────────

describe('Spacing', () => {
  it('all values are positive numbers', () => {
    for (const [key, val] of Object.entries(Spacing)) {
      expect(typeof val).toBe('number');
      expect(val).toBeGreaterThan(0);
    }
  });

  it('has both numbered and named aliases', () => {
    expect(Spacing).toHaveProperty('one');
    expect(Spacing).toHaveProperty('xs');
    expect(Spacing).toHaveProperty('md');
    expect(Spacing).toHaveProperty('xl');
  });

  it('named aliases match numbered equivalents', () => {
    expect(Spacing.xs).toBe(Spacing.one);
    expect(Spacing.sm).toBe(Spacing.two);
    expect(Spacing.md).toBe(Spacing.three);
    expect(Spacing.lg).toBe(Spacing.four);
    expect(Spacing.xl).toBe(Spacing.five);
    expect(Spacing.xxl).toBe(Spacing.six);
  });
});

// ── Radius ─────────────────────────────────────────────────────

describe('Radius', () => {
  it('values increase with size', () => {
    expect(Radius.sm).toBeLessThan(Radius.md);
    expect(Radius.md).toBeLessThan(Radius.lg);
    expect(Radius.lg).toBeLessThan(Radius.xl);
    expect(Radius.xl).toBeLessThan(Radius.full);
  });

  it('full is a large pill-like value', () => {
    expect(Radius.full).toBe(999);
  });
});

// ── Shadows ────────────────────────────────────────────────────

describe('Shadows', () => {
  it('green shadow has expected structure', () => {
    expect(Shadows.green).toHaveProperty('shadowColor');
    expect(Shadows.green).toHaveProperty('shadowOffset');
    expect(Shadows.green).toHaveProperty('shadowOpacity');
    expect(Shadows.green).toHaveProperty('shadowRadius');
    expect(Shadows.green).toHaveProperty('elevation');
  });

  it('card shadow has lower elevation than green', () => {
    expect(Shadows.card.elevation).toBeLessThan(Shadows.green.elevation);
  });
});
