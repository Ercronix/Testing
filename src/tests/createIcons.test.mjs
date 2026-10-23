import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

describe('create-icons.mjs', () => {
  // The script embeds a copy of the icon runtime so it can bootstrap other repos.
  test('embedded icons/openbridgeIcons.tsx matches src (run --sync-runtime if not)', () => {
    const embedded = execFileSync(
      'node',
      ['scripts/create-icons.mjs', '--print-runtime', 'icons/openbridgeIcons.tsx'],
      { encoding: 'utf8' },
    );
    expect(embedded).toBe(readFileSync('src/icons/openbridgeIcons.tsx', 'utf8'));
  });

  test('generated data is up to date with the installed OpenBridge package', () => {
    const output = execFileSync('node', ['scripts/create-icons.mjs', '--dry-run'], {
      encoding: 'utf8',
    });
    const count = Number(output.match(/: (\d+) icons/)?.[1]);
    const data = readFileSync('src/icons/openbridgeIcons.generated.ts', 'utf8');
    expect(data.match(/^ {2}\['/gm)?.length).toBe(count);
  });
});
