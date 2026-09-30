import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const runtimeFiles = [
  'utils/AutoSizer.tsx',
  'utils/valueMapping.ts',
  'dynamicProperties/angleMath.ts',
];

describe('create-element.mjs', () => {
  // The script embeds copies of these helpers so it can bootstrap other repos.
  test.each(runtimeFiles)('embedded %s matches src (run --sync-runtime if not)', (file) => {
    const embedded = execFileSync('node', ['scripts/create-element.mjs', '--print-runtime', file], {
      encoding: 'utf8',
    });
    expect(embedded).toBe(readFileSync(`src/${file}`, 'utf8'));
  });
});
