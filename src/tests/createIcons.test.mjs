import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

const script = resolve('scripts/create-icons.mjs');

describe('create-icons.mjs', () => {
  // The script embeds a copy of the icon runtime so it can bootstrap other repos.
  test('embedded icons/iconData.tsx matches src (run --sync-runtime if not)', () => {
    const embedded = execFileSync('node', [script, '--print-runtime', 'icons/iconData.tsx'], {
      encoding: 'utf8',
    });
    expect(embedded).toBe(readFileSync('src/icons/iconData.tsx', 'utf8'));
  });

  test('generated data is up to date with the installed OpenBridge package', () => {
    const output = execFileSync('node', [script, '--openbridge', '--dry-run'], {
      encoding: 'utf8',
    });
    const count = Number(output.match(/: (\d+) icons/)?.[1]);
    const data = readFileSync('src/icons/openbridgeIcons.generated.ts', 'utf8');
    expect(data.match(/^ {2}\['/gm)?.length).toBe(count);
  });
});

// 1×1 transparent PNG.
const PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

describe('create-icons.mjs --from', () => {
  let project;
  const run = (...args) =>
    execFileSync('node', [script, '--root', project, ...args], {
      encoding: 'utf8',
      stdio: 'pipe',
    });
  const read = (file) => readFileSync(join(project, file), 'utf8');

  beforeAll(() => {
    project = mkdtempSync(join(tmpdir(), 'create-icons-'));
    symlinkSync(resolve('node_modules'), join(project, 'node_modules'), 'dir');
    mkdirSync(join(project, 'src'));
    writeFileSync(join(project, 'package.json'), '{}');
    for (const file of ['tsconfig.json', '.prettierrc.json']) {
      writeFileSync(join(project, file), readFileSync(file));
    }
    writeFileSync(
      join(project, 'src/main.tsx'),
      "import { createLibraryExtension } from '@hmiproject/helio-sdk';\n\nexport default createLibraryExtension({\n  name: 'X',\n  elements: [],\n});\n",
    );
    const icons = join(project, 'my-icons');
    mkdirSync(join(icons, 'Pumps'), { recursive: true });
    writeFileSync(
      join(icons, 'valve_open.svg'),
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M2 6L12 12" stroke="#1E1E1E"/><path id="a" d="M0 0" fill="#1e1e1e"/><use href="#a"/></svg>',
    );
    writeFileSync(
      join(icons, 'Pumps/pump-alarm.svg'),
      '<?xml version="1.0"?><svg viewBox="100 100 48 48"><style>.st0{fill:#E30613}</style><circle class="st0" cx="124" cy="124" r="20"/><path d="M0 0" fill="#fff"/></svg>',
    );
    writeFileSync(join(icons, 'tank.png'), Buffer.from(PNG, 'base64'));
  });

  afterAll(() => rmSync(project, { recursive: true, force: true }));

  test('without arguments it needs an icons/ folder', () => {
    expect(() => run()).toThrow(/No icons\/ folder/);
  });

  test('without arguments it reads icons/, with the extension name as category', () => {
    mkdirSync(join(project, 'icons/Tanks'), { recursive: true });
    writeFileSync(join(project, 'icons/Tanks/tank-full.svg'), '<svg viewBox="0 0 24 24"/>');
    run();
    const data = read('src/icons/customIcons.generated.ts');
    expect(data).toContain("['Tank Full', 'Tanks/tank-full.svg', 0,");
    expect(data).toContain("'X / Tanks'");
    expect(data).toMatch(/Regenerate with `node \S*create-icons\.mjs`\./);
    expect(read('src/main.tsx')).toContain('icons: [...customIcons]');
  });

  test('writes the set, the runtime and registers it in main.tsx', () => {
    run('--from', 'my-icons', '--category', 'Plant', '--out', 'plantIcons');
    // No .prettierrc in the temp project: prettier's default double quotes.
    expect(read('src/main.tsx')).toMatch(
      /import \{ plantIcons \} from ["']\.\/icons\/plantIcons\.generated["'];/,
    );
    expect(read('src/main.tsx')).toMatch(/icons: \[\.\.\.plantIcons, \.\.\.customIcons\]/);
    expect(read('src/icons/iconData.tsx')).toBe(readFileSync('src/icons/iconData.tsx', 'utf8'));
  });

  test('names, categories and sizes come from the files', async () => {
    const { plantIcons } = await import(join(project, 'src/icons/plantIcons.generated.ts'));
    expect(plantIcons.map((i) => [i.name, i.category, i.description])).toEqual([
      ['Pump Alarm', 'Plant / Pumps', 'Pumps/pump-alarm.svg'],
      ['Tank', 'Plant', 'tank.png'],
      ['Valve Open', 'Plant', 'valve_open.svg'],
    ]);
    const html = (name) =>
      renderToStaticMarkup(
        createElement(plantIcons.find((i) => i.name === name).Icon, { size: 'M' }),
      );

    // Single-color SVG → currentColor, ids prefixed.
    const valve = html('Valve Open');
    expect(valve).toContain('stroke="currentColor"');
    expect(valve).not.toMatch(/1e1e1e/i);
    expect(valve).toContain('id="plantIcons-valve-open-a"');
    expect(valve).toContain('href="#plantIcons-valve-open-a"');

    // Multi-color SVG keeps its colors; viewBox offset and size are normalized; classes scoped.
    const alarm = html('Pump Alarm');
    expect(alarm).toContain('viewBox="0 0 24 24"');
    expect(alarm).toContain('transform="scale(0.5) translate(-100 -100)"');
    expect(alarm).toContain('.plantIcons-pumps-pump-alarm-st0{fill:#E30613}');
    expect(alarm).toContain('class="plantIcons-pumps-pump-alarm-st0"');

    expect(html('Tank')).toContain(`href="data:image/png;base64,${PNG}"`);
  });

  test('--tint masks PNGs with currentColor', () => {
    run('--from', 'my-icons', '--out', 'plantIcons', '--tint');
    expect(read('src/icons/plantIcons.generated.ts')).toMatch(/<mask id="plantIcons-tank-mask"/);
  });

  test('refuses names that another icon set already uses', () => {
    mkdirSync(join(project, 'more-icons'));
    writeFileSync(join(project, 'more-icons/valve-open.svg'), '<svg viewBox="0 0 24 24"/>');
    expect(() => run('--from', 'more-icons', '--out', 'otherIcons')).toThrow(/Valve Open/);
  });
});
