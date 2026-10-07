import { useDesignTokens, type DesignTokens } from '@hmiproject/helio-sdk';
import { useEffect, type ReactNode } from 'react';

/**
 * OpenBridge CSS variables that follow the active HELIO theme, and the HELIO
 * design token each one takes its value from. CSS variables inherit into the
 * shadow DOM of the OpenBridge components. Alert colours (`--alert-*`,
 * `--critical-*`, `--warning-*`, …) are deliberately not mapped: their meaning
 * is fixed by OpenBridge.
 */
export const OPENBRIDGE_TOKEN_MAP: Record<string, keyof DesignTokens> = {
  '--selected-enabled-background-color': 'controlsPrimaryBackground',
  '--selected-focused-background-color': 'controlsPrimaryBackground',
  '--selected-hover-background-color': 'controlsPrimaryBackgroundHover',
  '--selected-pressed-background-color': 'controlsPrimaryBackgroundActive',
  '--selected-enabled-border-color': 'controlsPrimaryBackgroundActive',
  '--selected-focused-border-color': 'controlsPrimaryBackgroundActive',
  '--selected-hover-border-color': 'controlsPrimaryBackgroundActive',
  '--selected-pressed-border-color': 'controlsPrimaryBackgroundActive',
  '--on-selected-active-color': 'controlsPrimaryText',
  '--instrument-enhanced-primary-color': 'controlsPrimaryBackgroundActive',
  '--instrument-enhanced-secondary-color': 'controlsPrimaryBackground',
  '--instrument-enhanced-secondary-dif-color': 'controlsCheckedBackgroundActive',
  '--instrument-enhanced-tertiary-color': 'controlsCheckedBackground',
  '--element-active-enhanced-color': 'controlsPrimaryBackgroundActive',
  '--border-focus-color': 'signalingAccentBackground',
};

/** Builds the OpenBridge CSS variables from HELIO design tokens; missing tokens are left out. */
export function openBridgeThemeVars(tokens: Partial<DesignTokens>): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [variable, token] of Object.entries(OPENBRIDGE_TOKEN_MAP)) {
    const value = tokens[token];
    if (typeof value === 'string' && value !== '') vars[variable] = value;
  }
  return vars;
}

/** OpenBridge palettes used for light and dark HELIO themes (OpenBridge also has `bright` and `night`). */
export const LIGHT_PALETTE = 'day';
export const DARK_PALETTE = 'dusk';

/** Lightness (0 = black, 1 = white) of an `hsl()`, `rgb()` or hex colour; `undefined` if unknown. */
export function colorLightness(color: string): number | undefined {
  const hsl = color.match(/hsla?\(\s*[\d.]+(?:deg)?[\s,]+[\d.]+%[\s,]+([\d.]+)%/i);
  if (hsl) return Number(hsl[1]) / 100;
  const rgb = color.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  const hex = color.match(/^#([\da-f]{3}|[\da-f]{6})\b/i)?.[1];
  const channels = rgb
    ? rgb.slice(1, 4).map(Number)
    : hex
      ? (hex.length === 3 ? [...hex].map((c) => c + c) : hex.match(/../g)!).map((c) =>
          parseInt(c, 16),
        )
      : undefined;
  if (!channels) return undefined;
  const [r, g, b] = channels;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/**
 * OpenBridge palette for the active HELIO theme. The design tokens have no
 * light/dark flag, so it is derived from the background of the theme.
 */
export function openBridgePalette(tokens: Partial<DesignTokens>): string | undefined {
  const background = tokens.containerLevel1Background;
  const lightness = typeof background === 'string' ? colorLightness(background) : undefined;
  if (lightness === undefined) return undefined;
  return lightness < 0.5 ? DARK_PALETTE : LIGHT_PALETTE;
}

/** Id of the `<style>` element in `<head>` that holds the theme variables. */
export const THEME_STYLE_ID = 'openbridge-helio-theme';

/**
 * CSS rule with the theme variables, declared on every element rather than
 * only on `<html>`: HELIO's tokens are formulas such as
 * `hsla(var(--utilsPrimaryHue, 193) …)`, and HELIO sets `--utilsPrimaryHue`
 * on its own container, not on `<html>`. A variable containing `var()` is
 * resolved where it is declared, so on `<html>` it would always use the
 * fallback (HELIO's default colour). Declared on every element, each one
 * resolves it with the HELIO values it inherits – also live when the theme
 * changes. `:root:root:root` outranks the `:root[data-obc-theme="…"]` rules
 * of `openbridge.css` (which declares these variables only on `:root`).
 */
export function openBridgeThemeCss(vars: Record<string, string>): string {
  const declarations = Object.entries(vars).map(([name, value]) => `${name}: ${value};`);
  return `:root:root:root, :root:root:root * { ${declarations.join(' ')} }`;
}

/**
 * Applies the active HELIO theme to every OpenBridge component on the page:
 * the accent colours (primary colour etc.) as CSS variables in our own
 * `<style>` element, and light/dark as the OpenBridge palette
 * (`data-obc-theme` on `<html>`). Only variables are overridden, so
 * `openbridge.css` itself stays as it is. The variables are deliberately not
 * set as inline styles on `<html>`: HELIO may replace that `style` attribute.
 * Call it in every element; they all write the same values.
 */
export function useOpenBridgeTheme() {
  const tokens = useDesignTokens();
  const palette = openBridgePalette(tokens);
  const css = openBridgeThemeCss(openBridgeThemeVars(tokens));

  useEffect(() => {
    if (palette) document.documentElement.dataset.obcTheme = palette;
  }, [palette]);

  useEffect(() => {
    let style = document.getElementById(THEME_STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = THEME_STYLE_ID;
      document.head.appendChild(style);
    }
    if (style.textContent !== css) style.textContent = css;
  }, [css]);
}

/** Wrapper form of {@link useOpenBridgeTheme}, e.g. for Storybook decorators. */
export function OpenBridgeTheme({ children }: { children: ReactNode }) {
  useOpenBridgeTheme();
  return <>{children}</>;
}
