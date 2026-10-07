import { useDesignTokens } from '@hmiproject/helio-sdk';
import { describe, expect, test } from 'vitest';
import { OPENBRIDGE_TOKEN_MAP, openBridgeThemeVars } from '../utils/OpenBridgeTheme';

describe('openBridgeThemeVars', () => {
  test('maps HELIO tokens to OpenBridge variables', () => {
    const vars = openBridgeThemeVars({
      controlsPrimaryBackground: 'red',
      controlsPrimaryBackgroundActive: 'darkred',
    }) as Record<string, string>;
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
