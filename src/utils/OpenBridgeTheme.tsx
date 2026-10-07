import { useDesignTokens, type DesignTokens } from '@hmiproject/helio-sdk';
import type { CSSProperties, ReactNode } from 'react';

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

/**
 * Applies the active HELIO theme (primary colour etc.) to the OpenBridge
 * components inside. `display: contents` keeps the wrapper out of the layout.
 */
export function OpenBridgeTheme({ children }: { children: ReactNode }) {
  const tokens = useDesignTokens();
  return <div style={{ display: 'contents', ...openBridgeThemeVars(tokens) }}>{children}</div>;
}
