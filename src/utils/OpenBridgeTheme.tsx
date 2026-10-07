import { useDesignTokens, type DesignTokens } from '@hmiproject/helio-sdk';
import { useEffect, type CSSProperties, type ReactNode } from 'react';

/**
 * OpenBridge CSS variables that follow the active HELIO theme, and the HELIO
 * design token each one takes its value from. CSS variables inherit into the
 * shadow DOM of the OpenBridge components, so setting them on a wrapper is
 * enough. Alert colours (`--alert-*`, `--critical-*`, `--warning-*`, …) are
 * deliberately not mapped: their meaning is fixed by OpenBridge.
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
export function openBridgeThemeVars(tokens: Partial<DesignTokens>): CSSProperties {
  const vars: Record<string, string> = {};
  for (const [variable, token] of Object.entries(OPENBRIDGE_TOKEN_MAP)) {
    const value = tokens[token];
    if (typeof value === 'string' && value !== '') vars[variable] = value;
  }
  return vars as CSSProperties;
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

/**
 * Applies the active HELIO theme to the OpenBridge components inside: the
 * accent colours (primary colour etc.) on the wrapper – `display: contents`
 * keeps it out of the layout – and light/dark as the OpenBridge palette on
 * `<html>` (OpenBridge only defines palettes on `:root[data-obc-theme]`).
 */
export function OpenBridgeTheme({ children }: { children: ReactNode }) {
  const tokens = useDesignTokens();
  const palette = openBridgePalette(tokens);

  useEffect(() => {
    if (palette) document.documentElement.dataset.obcTheme = palette;
  }, [palette]);

  return <div style={{ display: 'contents', ...openBridgeThemeVars(tokens) }}>{children}</div>;
}
