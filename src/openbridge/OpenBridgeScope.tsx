import type { CSSProperties, ReactNode } from 'react';
import type { ObcTheme } from '../compass/compassMapping';
import { OPENBRIDGE_SCOPE_CLASS, openbridgeThemeCss } from './openbridgeTheme.generated';

const STYLE_ELEMENT_ID = 'obc-helio-theme';

/**
 * Adds the (scoped) OpenBridge design tokens to the document once. Tokens are
 * scoped to `.obc-helio-scope`, so HELIO's own styling is never affected.
 */
function ensureOpenBridgeTheme() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ELEMENT_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ELEMENT_ID;
  style.textContent = openbridgeThemeCss;
  document.head.appendChild(style);
}

type OpenBridgeScopeProps = {
  theme: ObcTheme;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

/** Provides the OpenBridge palette (`bright` / `day` / `dusk` / `night`) to its children. */
export function OpenBridgeScope({ theme, className, style, children }: OpenBridgeScopeProps) {
  ensureOpenBridgeTheme();

  return (
    <div
      className={[OPENBRIDGE_SCOPE_CLASS, className].filter(Boolean).join(' ')}
      data-obc-theme={theme}
      style={style}
    >
      {children}
    </div>
  );
}
