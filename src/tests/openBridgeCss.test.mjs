import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { expect, test } from 'vitest';
import { OPENBRIDGE_TOKEN_MAP } from '../utils/OpenBridgeTheme';

// Fails after an OpenBridge update that renames or removes a variable that
// OPENBRIDGE_TOKEN_MAP overrides (the override would silently do nothing).
test('every mapped OpenBridge variable still exists in openbridge.css', () => {
  const css = readFileSync(
    createRequire(import.meta.url).resolve('@oicl/openbridge-webcomponents/dist/openbridge.css'),
    'utf8',
  );
  for (const variable of Object.keys(OPENBRIDGE_TOKEN_MAP)) {
    expect(css.includes(`${variable}:`), variable).toBe(true);
  }
});
