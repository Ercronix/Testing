import { useDesignTokens } from '@hmiproject/helio-sdk';
import { describe, expect, test } from 'vitest';
import {
  colorLightness,
  OPENBRIDGE_TOKEN_MAP,
  openBridgePalette,
  openBridgeThemeVars,
} from '../utils/OpenBridgeTheme';

describe('openBridgeThemeVars', () => {
  test('maps HELIO tokens to OpenBridge variables', () => {
    const vars = openBridgeThemeVars({
      controlsPrimaryBackground: 'red',
      controlsPrimaryBackgroundActive: 'darkred',
    });
    expect(vars['--selected-enabled-background-color']).toBe('red');
    expect(vars['--instrument-enhanced-primary-color']).toBe('darkred');
  });

  test('leaves out missing tokens, so OpenBridge keeps its own colour', () => {
    expect(openBridgeThemeVars({})).toEqual({});
  });

  test('every mapped token exists in the SDK defaults', () => {
    const defaults = useDesignTokens();
    for (const token of Object.values(OPENBRIDGE_TOKEN_MAP)) {
      expect(typeof defaults[token], token).toBe('string');
    }
  });
});

describe('openBridgePalette', () => {
  test('reads the lightness of hsl, rgb and hex colours', () => {
    expect(colorLightness('hsla(0 0% 100% / 1)')).toBe(1);
    expect(colorLightness('hsl(214, 6%, 12%)')).toBeCloseTo(0.12);
    expect(colorLightness('rgb(0, 0, 0)')).toBe(0);
    expect(colorLightness('#fff')).toBeCloseTo(1);
    expect(colorLightness('#202020')).toBeLessThan(0.2);
    expect(colorLightness('white')).toBeUndefined();
  });

  test('light HELIO theme → day, dark → dusk', () => {
    expect(openBridgePalette({ containerLevel1Background: 'hsla(0 0% 100% / 1)' })).toBe('day');
    expect(openBridgePalette({ containerLevel1Background: 'hsla(214 8% 14% / 1)' })).toBe('dusk');
  });

  test('unknown background keeps the current palette', () => {
    expect(openBridgePalette({})).toBeUndefined();
    expect(openBridgePalette({ containerLevel1Background: 'var(--x)' })).toBeUndefined();
  });

  test('SDK default theme is light', () => {
    expect(openBridgePalette(useDesignTokens())).toBe('day');
  });
});
