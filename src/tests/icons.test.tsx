import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { openBridgeIcons } from '../icons/openbridgeIcons';
import { OPENBRIDGE_ICONS } from '../icons/openbridgeIcons.generated';

describe('OpenBridge icons', () => {
  test('names are unique (HELIO uses them as IDs)', () => {
    const names = openBridgeIcons.map((icon) => icon.name);
    expect(new Set(names).size).toBe(names.length);
  });

  test('every icon has a category and the OpenBridge tag as description', () => {
    for (const icon of openBridgeIcons) {
      expect(icon.category).toMatch(/^OpenBridge: /);
      expect(icon.description).toMatch(/^obi-/);
    }
  });

  test('renders the currentColor SVG and passes SVG props through', () => {
    const icon = openBridgeIcons.find((i) => i.description === 'obi-ais-proposal');
    expect(icon?.name).toBe('AIS Proposal');
    const html = renderToStaticMarkup(
      icon ? <icon.Icon size="M" className="x" width="100%" /> : null,
    );
    expect(html).toMatch(/^<svg [^>]*viewBox="0 0 24 24"[^>]*fill="currentColor"[^>]*>/);
    expect(html).toContain('class="x"');
    expect(html).toContain('width="100%"');
    expect(html).not.toContain('size=');
    expect(html).toContain('<path');
  });

  test('element ids are prefixed per icon', () => {
    const withIds = OPENBRIDGE_ICONS.filter(([, , , , , markup]) => markup.includes(' id="'));
    expect(withIds.length).toBeGreaterThan(0);
    for (const [id, , , , , markup] of withIds) {
      for (const [, ref] of markup.matchAll(/(?:id="|url\(#|href="#)([^")]+)/g)) {
        expect(ref.startsWith(`obi-${id}-`)).toBe(true);
      }
    }
  });
});
