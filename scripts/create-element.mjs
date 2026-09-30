/**
 * Generates a HELIO element for an OpenBridge web component, following the
 * same structure as the hand-written Compass / Azimuth Thruster:
 *
 *   src/components/<Name>.tsx           presentational component (AutoSizer)
 *   src/components/<Name>.stories.tsx   Storybook stories
 *   src/elements/<Name>Element.tsx      HELIO element (props schema + DP resolution)
 *   docs/openbridge-<tag>.md            property reference
 *   src/main.tsx                        registration
 *
 * Properties, types, defaults and descriptions come from the OpenBridge
 * `custom-elements.json` manifest; enum values and advice shapes are read from
 * the package's `.d.ts` files.
 *
 * Usage:
 *   npm run create:element -- <component> [options]
 *
 *   <component>          OpenBridge tag without `obc-`, e.g. `gauge-radial`, `compass-flat`
 *   --name "Radial Gauge"  display name (default: derived from the tag)
 *   --primary a,b        main values: required DPs that drive the `loading` state
 *                        (default: first of value/heading/angle/… that exists)
 *   --shape square|fill  square = largest square that fits (radial instruments),
 *                        fill = use the whole container (default: square if the
 *                        component supports `faceDiameter`, else fill)
 *   --icon Tachometer    HELIO icon name
 *   --force              overwrite existing files
 *   --dry-run            print what would be generated, write nothing
 *   --list               list all available OpenBridge instruments
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkgDir = resolve(root, 'node_modules/@oicl/openbridge-webcomponents');
const manifest = JSON.parse(readFileSync(resolve(pkgDir, 'custom-elements.json'), 'utf8'));

// ── CLI ──────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) args._.push(arg);
    else if (['force', 'dry-run', 'list'].includes(arg.slice(2))) args[arg.slice(2)] = true;
    else args[arg.slice(2)] = argv[++i];
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

function fail(message) {
  console.error(`\x1b[31m${message}\x1b[0m`);
  process.exit(1);
}

const instruments = manifest.modules.flatMap((mod) =>
  (mod.declarations ?? [])
    .filter((d) => d.customElement && d.tagName)
    .map((declaration) => ({ mod, declaration })),
);

if (args.list) {
  const tags = instruments
    .filter(({ mod }) => mod.path.includes('navigation-instruments/'))
    .map(({ declaration }) => declaration.tagName.replace(/^obc-/, ''));
  console.log(tags.sort().join('\n'));
  process.exit(0);
}

const tagArg = args._[0];
if (!tagArg) fail('Usage: npm run create:element -- <component> [--name "..."] (see --list)');

const tag = tagArg.startsWith('obc-') ? tagArg : `obc-${tagArg}`;
const found = instruments.find(({ declaration }) => declaration.tagName === tag);
if (!found) fail(`No OpenBridge component <${tag}> found. Run with --list to see all.`);

const { mod, declaration } = found;
const shortTag = tag.replace(/^obc-/, '');
const modulePath = mod.path.replace(/^src\//, '').replace(/\.ts$/, '');
const distDts = resolve(pkgDir, 'dist', `${modulePath}.d.ts`);
const obcClass = declaration.name;

const toPascal = (s) =>
  s
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('');
const toTitle = (s) =>
  s
    .split('-')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');

const displayName = args.name ?? toTitle(shortTag);
const Name = toPascal(displayName);
const elementVar = `${Name[0].toLowerCase()}${Name.slice(1)}Element`;
const propsType = `${Name}Props`;

// ── Type resolution from .d.ts files ─────────────────────────────────────

const dtsCache = new Map();
function readDts(file) {
  if (!dtsCache.has(file)) dtsCache.set(file, existsSync(file) ? readFileSync(file, 'utf8') : '');
  return dtsCache.get(file);
}

function importTarget(fromFile, spec) {
  return resolve(dirname(fromFile), spec.replace(/\.js$/, '.d.ts'));
}

function parseEnumBody(body) {
  const values = [];
  for (const line of body.split(',')) {
    const match = line.trim().match(/^(\w+)\s*=\s*(.+)$/);
    if (!match) continue;
    const raw = match[2].trim();
    if (!/^["'].*["']$/.test(raw)) return undefined; // numeric enums are not supported
    values.push({ key: match[1], value: raw.slice(1, -1) });
  }
  return values;
}

/** Resolves a type name to `{ kind: 'enum', values }` or `{ kind: 'interface', fields }`. */
function resolveType(name, file = distDts, depth = 0) {
  if (depth > 4 || !/^\w+$/.test(name)) return undefined;
  const text = readDts(file);

  const enumMatch = text.match(new RegExp(`export declare enum ${name}\\s*\\{([^}]*)\\}`));
  if (enumMatch) {
    const values = parseEnumBody(enumMatch[1]);
    return values?.length ? { kind: 'enum', values } : undefined;
  }

  const unionMatch = text.match(new RegExp(`export type ${name}\\s*=\\s*([^;]+);`));
  if (unionMatch) {
    const parts = unionMatch[1].split('|').map((p) => p.trim());
    if (parts.every((p) => /^["'].*["']$/.test(p))) {
      return {
        kind: 'enum',
        values: parts.map((p) => ({ key: p.slice(1, -1), value: p.slice(1, -1) })),
      };
    }
    return undefined;
  }

  const interfaceMatch = text.match(new RegExp(`export interface ${name}\\s*\\{([^}]*)\\}`));
  if (interfaceMatch) {
    const fields = [...interfaceMatch[1].matchAll(/(\w+)(\?)?:\s*([^;]+);/g)].map((m) => ({
      name: m[1],
      optional: Boolean(m[2]),
      type: m[3].trim(),
    }));
    return { kind: 'interface', fields };
  }

  // Follow imports and re-exports that mention the name.
  const refs = [
    ...text.matchAll(/(?:import|export)\s+(?:type\s+)?\{([^}]*)\}\s+from\s+'([^']+)'/g),
  ];
  for (const [, names, spec] of refs) {
    const hit = names
      .split(',')
      .map((n) => n.trim().replace(/^type\s+/, ''))
      .find((n) => n === name || n.endsWith(` as ${name}`));
    if (hit) {
      const original = hit.includes(' as ') ? hit.split(' as ')[0].trim() : hit;
      return resolveType(original, importTarget(file, spec), depth + 1);
    }
  }
  for (const [, spec] of text.matchAll(/export\s+\*\s+from\s+'([^']+)'/g)) {
    const result = resolveType(name, importTarget(file, spec), depth + 1);
    if (result) return result;
  }
  return undefined;
}

// ── Member classification ────────────────────────────────────────────────

const SKIPPED_NAMES = new Set(['faceDiameter', 'touching', 'loading', 'newSetpoint']);
const PRIMARY_CANDIDATES = [
  'value',
  'heading',
  'angle',
  'speed',
  'depth',
  'pitch',
  'roll',
  'heave',
];
const DATA_NAMES =
  /^(value|heading|courseOverGround|rateOfTurn\w*|angle|thrust|speed\w*|depth|pitch|roll|heave|yaw|surge|sway|wind\w*|current\w*|bearing|rudder\w*)$/;

function parseDefault(raw, resolved) {
  if (raw === undefined) return undefined;
  const text = raw.trim();
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
  if (text === 'true' || text === 'false') return text === 'true';
  if (/^'.*'$|^".*"$/.test(text)) return text.slice(1, -1);
  if (resolved?.kind === 'enum') {
    const lookup = (ref) => {
      const key = ref.trim().split('.').pop();
      return resolved.values.find((v) => v.key === key)?.value;
    };
    if (/^\[.*\]$/s.test(text)) {
      return text
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map(lookup)
        .filter((v) => v !== undefined);
    }
    return lookup(text);
  }
  return undefined;
}

const skipped = [];
const members = [];

for (const field of declaration.members ?? []) {
  if (field.kind !== 'field' || field.static || field.readonly) continue;
  if (field.privacy && field.privacy !== 'public') continue;
  if (field.name.startsWith('_')) continue;
  const typeText = field.type?.text;
  const description = (field.description ?? '').replace(/\s+/g, ' ').trim();

  const skip = (reason) => skipped.push({ name: field.name, type: typeText ?? '?', reason });

  if (!typeText) continue; // methods / getters without type
  if (SKIPPED_NAMES.has(field.name) || /^new[A-Z]\w*Setpoint$/.test(field.name)) continue;
  if (/^departing/.test(field.name)) continue;
  if (field.deprecated || /^\*\*deprecated/i.test(description)) continue;

  const optionalType = /\|\s*undefined/.test(typeText);
  const base = typeText.replace(/\s*\|\s*undefined/g, '').trim();
  const member = { name: field.name, base, optionalType, description };

  if (field.name === 'state' && base === 'InstrumentState') member.kind = 'state';
  else if (field.name === 'priority' && base === 'Priority') member.kind = 'priority';
  else if (base === 'number') member.kind = 'number';
  else if (base === 'boolean') member.kind = 'boolean';
  else if (base === 'string') member.kind = 'string';
  else if (/^\w+\[\]$/.test(base)) {
    const item = resolveType(base.slice(0, -2));
    if (item?.kind === 'enum') {
      member.kind = 'enumList';
      member.options = item.values.map((v) => v.value);
      member.resolved = item;
    } else if (item?.kind === 'interface') {
      const names = item.fields.map((f) => f.name);
      const minKey = names.find((n) => /^min/.test(n));
      const maxKey = names.find((n) => /^max/.test(n));
      if (names.includes('type') && names.includes('hinted') && minKey && maxKey) {
        member.kind = 'advice';
        member.minKey = minKey;
        member.maxKey = maxKey;
        member.angle = minKey === 'minAngle';
      } else {
        skip('array of objects');
        continue;
      }
    } else {
      skip('unsupported array type');
      continue;
    }
  } else {
    const resolved = resolveType(base);
    if (resolved?.kind === 'enum') {
      member.kind = 'enum';
      member.options = resolved.values.map((v) => v.value);
      member.resolved = resolved;
    } else {
      skip('unsupported type');
      continue;
    }
  }

  member.default = parseDefault(field.default, member.resolved);
  members.push(member);
}

const has = (kind) => members.some((m) => m.kind === kind);
const numberNames = members.filter((m) => m.kind === 'number').map((m) => m.name);

const primaryNames = args.primary
  ? args.primary.split(',').map((s) => s.trim())
  : [PRIMARY_CANDIDATES.find((c) => numberNames.includes(c))].filter(Boolean);
for (const name of primaryNames) {
  if (!numberNames.includes(name)) fail(`--primary ${name}: no numeric property with that name.`);
}

const shape =
  args.shape ?? (declaration.members?.some((m) => m.name === 'faceDiameter') ? 'square' : 'fill');
if (!['square', 'fill'].includes(shape)) fail('--shape must be "square" or "fill"');

const icon =
  args.icon ??
  (/compass|heading|bearing/.test(shortTag)
    ? 'Compass'
    : /thruster|propulsion|engine|propeller/.test(shortTag)
      ? 'Fan'
      : /speed/.test(shortTag)
        ? 'Speed'
        : /gauge|rot|rudder|pitch|roll|heave|depth/.test(shortTag)
          ? 'Tachometer'
          : 'Dashboard');

// ── Prop model ───────────────────────────────────────────────────────────

const humanize = (name) => {
  const words = name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(' ');
  return words
    .map((w, i) =>
      ACRONYMS.has(w.toLowerCase())
        ? w.toUpperCase()
        : i === 0
          ? w[0].toUpperCase() + w.slice(1)
          : /^[A-Z]{2,}/.test(w)
            ? w
            : w.toLowerCase(),
    )
    .join(' ');
};

const ACRONYMS = new Set(['rot', 'hdg', 'cog', 'sog', 'stw', 'fov']);

const formatDefault = (value) => (Array.isArray(value) ? value.join(', ') : String(value));

function groupFor(member) {
  if (primaryNames.includes(member.name) || DATA_NAMES.test(member.name)) return 'data';
  if (/setpoint/i.test(member.name)) return 'setpoint';
  return 'display';
}

const RESERVED_KEYS = new Set(['isOff', 'isLoading', 'enhancedPriority', 'onClick']);
for (const m of members) {
  if (RESERVED_KEYS.has(m.name)) fail(`Property name "${m.name}" collides with a generated prop.`);
}

/** Every HELIO prop that ends up in the schema, in order. */
const schemaProps = [];
const groups = new Map([['data', { label: 'Values' }]]);

if (has('state')) {
  schemaProps.push(
    { key: 'isOff', group: 'data', kind: 'dpBoolean', label: 'Instrument off', optional: true },
    {
      key: 'isLoading',
      group: 'data',
      kind: 'dpBoolean',
      label: 'Instrument loading',
      optional: true,
    },
  );
}

for (const m of members) {
  const group = groupFor(m);
  if (m.kind === 'state') continue;
  if (m.kind === 'priority') {
    schemaProps.push({
      key: 'enhancedPriority',
      group: 'display',
      kind: 'dpBoolean',
      label: 'Enhanced priority (blue)',
      optional: true,
      member: m,
    });
    continue;
  }
  const hint =
    m.default !== undefined && m.default !== '' ? ` (default ${formatDefault(m.default)})` : '';
  const label = humanize(m.name);
  switch (m.kind) {
    case 'number':
      if (primaryNames.includes(m.name)) {
        schemaProps.push({
          key: m.name,
          group,
          kind: 'dpNumber',
          label,
          optional: false,
          defaultValue: m.default ?? 0,
          member: m,
          primary: true,
        });
      } else {
        schemaProps.push({
          key: m.name,
          group,
          kind: 'dpNumber',
          label: label + hint,
          optional: true,
          member: m,
        });
      }
      break;
    case 'boolean':
      schemaProps.push({
        key: m.name,
        group,
        kind: 'dpBoolean',
        label: label + hint,
        optional: true,
        member: m,
      });
      break;
    case 'string':
      schemaProps.push({
        key: m.name,
        group,
        kind: 'dpString',
        label: label + hint,
        optional: true,
        member: m,
      });
      break;
    case 'enum':
      schemaProps.push({
        key: m.name,
        group,
        kind: 'enum',
        label,
        optional: m.default === undefined,
        defaultValue: m.default,
        member: m,
      });
      break;
    case 'enumList':
      schemaProps.push({
        key: m.name,
        group,
        kind: 'dpString',
        label: `${label} (${m.options.join(', ')})`,
        optional: true,
        member: m,
      });
      break;
    case 'advice': {
      const prefix = m.name.replace(/Advices$/, '').replace(/^advices$/, '');
      const groupKey = `${m.name}Zones`;
      const unit = m.angle ? '°' : '';
      groups.set(groupKey, {
        label: prefix ? `${humanize(prefix)} advice zones` : 'Advice zones',
        defaultClosed: true,
      });
      m.zoneKeys = {};
      for (const type of ['advice', 'caution']) {
        const k = (suffix) => (prefix ? `${prefix}${toPascal(type)}${suffix}` : `${type}${suffix}`);
        m.zoneKeys[type] = {
          enabled: k('Enabled'),
          min: k('Min'),
          max: k('Max'),
          hinted: k('Hinted'),
        };
        const zone = toPascal(type);
        schemaProps.push(
          {
            key: k('Enabled'),
            group: groupKey,
            kind: 'dpBoolean',
            label: `${zone} zone enabled`,
            optional: true,
          },
          {
            key: k('Min'),
            group: groupKey,
            kind: 'dpNumber',
            label: `${zone} zone from${unit ? ` [${unit}]` : ''}`,
            optional: true,
          },
          {
            key: k('Max'),
            group: groupKey,
            kind: 'dpNumber',
            label: `${zone} zone to${unit ? ` [${unit}]` : ''}`,
            optional: true,
          },
          {
            key: k('Hinted'),
            group: groupKey,
            kind: 'dpBoolean',
            label: `${zone} zone hinted`,
            optional: true,
          },
        );
      }
      break;
    }
  }
}

if (schemaProps.some((p) => p.group === 'setpoint')) groups.set('setpoint', { label: 'Setpoint' });
groups.set('display', { label: 'Display' });
// Advice groups were added in member order; move them after "Display".
for (const [key, value] of [...groups]) {
  if (key.endsWith('Zones')) {
    groups.delete(key);
    groups.set(key, value);
  }
}
groups.set('interaction', { label: 'Interaction', defaultClosed: true });

// Only keep groups that are used.
for (const key of [...groups.keys()]) {
  if (key !== 'interaction' && !schemaProps.some((p) => p.group === key)) groups.delete(key);
}

// ── Code generation ──────────────────────────────────────────────────────

const q = (value) => `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const literal = (value) =>
  typeof value === 'string'
    ? q(value)
    : Array.isArray(value)
      ? `[${value.map(literal).join(', ')}]`
      : String(value);
const dpVar = (key) => `${key}Dp`;

const componentKeys = members.map((m) => m.name);
const componentImportPath = `@oicl/openbridge-webcomponents/dist/${modulePath}.js`;
const reactImportPath = `@oicl/openbridge-webcomponents-react/${modulePath}.js`;
if (!existsSync(resolve(root, 'node_modules', `${reactImportPath}`))) {
  fail(`React wrapper not found: ${reactImportPath}`);
}

const classDescription = (declaration.description ?? declaration.summary ?? '')
  .replace(/`<obc-[\w-]+>`\s*[—-]\s*/, '')
  .split(/\n\s*\n/)[0]
  .replace(/\s+/g, ' ')
  .trim();
const elementDescription =
  classDescription && classDescription.length < 200
    ? `${classDescription.replace(/\.$/, '')} (OpenBridge design system).`
    : `${displayName} instrument (OpenBridge design system).`;

const sizeStyle =
  shape === 'square'
    ? `const size = Math.min(width, height);
        return (
          <${obcClass}
            style={{ display: 'block', width: size, height: size }}`
    : `return (
          <${obcClass}
            style={{ display: 'block', width, height }}`;

const componentSource = `${
  componentKeys.length
    ? `import type { ${obcClass} as ${obcClass}Element } from '${componentImportPath}';\n`
    : ''
}import { ${obcClass} } from '${reactImportPath}';
import { className, cx } from '@hmiproject/helio-sdk';
import { AutoSizer } from '../utils/AutoSizer';
import { definedProps } from '../utils/valueMapping';

export type ${propsType} = ${
  componentKeys.length
    ? `Partial<Pick<${obcClass}Element, ${componentKeys.map(q).join(' | ')}>> & `
    : ''
}{
  onClick?: () => void;
};

const classNames = {
  root: className({
    minHeight: ${shape === 'square' ? 120 : 48},
    fontFamily: "'Noto Sans', sans-serif",
  }),
  clickable: className({ cursor: 'pointer' }),
};

/**
 * Presentational wrapper around OpenBridge's \`<${tag}>\`. Receives fully
 * resolved values; all HELIO dynamic property handling happens in the element.
 * ${shape === 'square' ? 'The instrument is kept square and scaled to the largest size that fits.' : 'The instrument fills the available space.'}
 *
 * Generated by \`scripts/create-element.mjs\`.
 */
export function ${Name}({ onClick, ...props }: ${propsType}) {
  return (
    <AutoSizer className={cx(classNames.root, onClick && classNames.clickable)}>
      {({ width, height }) => {
        ${sizeStyle}
            onClick={onClick}
            {...definedProps(props)}
          />
        );
      }}
    </AutoSizer>
  );
}
`;

// Element

const valueTypeFor = { dpNumber: 'NumericValue', dpBoolean: 'Boolean', dpString: 'String' };
const readerFor = {
  dpNumber: 'values.Number()',
  dpBoolean: 'values.Boolean()',
  dpString: 'values.String()',
};

function schemaEntry(p) {
  const lines = [`label: ${q(p.label)}`, `propGroup: ${q(p.group)}`];
  if (p.kind === 'enum') {
    lines.push(`options: [${p.member.options.map(q).join(', ')}]`);
    lines.push(`optional: ${p.optional}`);
    if (!p.optional) lines.push(`defaultValue: ${q(p.defaultValue)}`);
    return `${p.key}: props.Enum({\n      ${lines.join(',\n      ')},\n    }),`;
  }
  lines.push(`valueType: ${q(valueTypeFor[p.kind])}`);
  lines.push(`optional: ${p.optional}`);
  if (!p.optional)
    lines.push(`defaultValue: dynamicProperties.StaticValue(${literal(p.defaultValue)})`);
  return `${p.key}: props.DynamicProperty({\n      ${lines.join(',\n      ')},\n    }),`;
}

const dpProps = schemaProps.filter((p) => p.kind !== 'enum');
const usedHelpers = new Set();
const use = (name) => (usedHelpers.add(name), name);

/**
 * Fallbacks that differ from the manifest default, for known OpenBridge quirks
 * (see the pitfalls in docs/openbridge-compass.md).
 */
const FALLBACK_OVERRIDES = {
  // `undefined` makes the component fall back to the deprecated
  // `rotationsPerMinute = 1`, so the ROT dots would spin forever.
  rateOfTurnDegreesPerMinute: () => '0',
  // Without a course the COG arrow should hide under the HDG arrow.
  courseOverGround: () => (primaryNames.includes('heading') ? 'headingRaw ?? 0' : undefined),
};

function withFallback(expr, member) {
  const override = FALLBACK_OVERRIDES[member.name]?.();
  if (override !== undefined) return `${expr} ?? ${override}`;
  return member.default !== undefined && !Array.isArray(member.default)
    ? `${expr} ?? ${literal(member.default)}`
    : expr;
}

function valueExpression(m) {
  const p = `p.${m.name}`;
  const dp = dpVar(m.name);
  switch (m.kind) {
    case 'number':
      if (primaryNames.includes(m.name)) return `${m.name}Raw ?? ${literal(m.default ?? 0)}`;
      return withFallback(`${use('optionalNumber')}(${p}, ${dp})`, m);
    case 'boolean':
      return withFallback(`${use('optionalBoolean')}(${p}, ${dp})`, m);
    case 'string':
      return withFallback(`${use('optionalString')}(${p}, ${dp})`, m);
    case 'enum':
      return `${p} as ${propsType}[${q(m.name)}]`;
    case 'enumList':
      return `(${p} === undefined
            ? undefined
            : ${use('parseEnumList')}(${dp}.value, [${m.options.map(q).join(', ')}])) as ${propsType}[${q(m.name)}]`;
    case 'priority':
      return `(${use('optionalBoolean')}(p.enhancedPriority, ${dpVar('enhancedPriority')}) ? 'enhanced' : 'regular') as ${propsType}['priority']`;
    case 'state': {
      const available = primaryNames.length
        ? primaryNames.map((n) => `${n}Raw !== undefined`).join(' && ')
        : 'true';
      return `${use('deriveInstrumentState')}({
            isOff: ${use('optionalBoolean')}(p.isOff, ${dpVar('isOff')}),
            isLoading: optionalBoolean(p.isLoading, ${dpVar('isLoading')}),
            valueAvailable: ${available},
          })`;
    }
    case 'advice': {
      const builder = use(m.angle ? 'buildAngleAdvices' : 'buildLinearAdvices');
      use('optionalBoolean');
      use('optionalNumber');
      const zones = ['advice', 'caution'].map((type) => {
        const k = m.zoneKeys[type];
        return `{
              type: AdviceType.${type},
              enabled: optionalBoolean(p.${k.enabled}, ${dpVar(k.enabled)}),
              min: optionalNumber(p.${k.min}, ${dpVar(k.min)}),
              max: optionalNumber(p.${k.max}, ${dpVar(k.max)}),
              hinted: optionalBoolean(p.${k.hinted}, ${dpVar(k.hinted)}),
            }`;
      });
      let expr = `${builder}([${zones.join(', ')}])`;
      const expected = m.angle ? ['minAngle', 'maxAngle'] : ['min', 'max'];
      if (m.minKey !== expected[0] || m.maxKey !== expected[1]) {
        expr += `.map(({ ${expected[0]}, ${expected[1]}, ...rest }) => ({ ...rest, ${m.minKey}: ${expected[0]}, ${m.maxKey}: ${expected[1]} }))`;
      }
      return `${expr} as ${propsType}[${q(m.name)}]`;
    }
  }
}

const componentAttributes = members
  .map((m) => `          ${m.name}={${valueExpression(m)}}`)
  .join('\n');

const primaryReads = primaryNames
  .map((n) => {
    use('toFiniteNumber');
    return `    const ${n}Raw = ${dpVar(n)}.canRead === false ? undefined : toFiniteNumber(${dpVar(n)}.value);`;
  })
  .join('\n');

const hasAdvice = has('advice');

const sdkImports = [
  'createElement',
  'createPropsSchema',
  dpProps.some((p) => !p.optional) && 'dynamicProperties',
  'props',
  'traits',
  'useAction',
  dpProps.length && 'useDynamicProperty',
  'useRenderMode',
  dpProps.length && 'values',
].filter(Boolean);
const usesPropsType = componentAttributes.includes(`${propsType}[`);

const elementSource = `import { ${sdkImports.join(', ')} } from '@hmiproject/helio-sdk';
${hasAdvice ? "import { AdviceType } from '@oicl/openbridge-webcomponents/dist/navigation-instruments/watch/advice.js';\n" : ''}import { Fragment } from 'react';
import { namespace } from '../namespace';
import { ${Name}${usesPropsType ? `, type ${propsType}` : ''} } from '../components/${Name}';
__HELPERS__
/**
 * OpenBridge ${displayName.toLowerCase()} (\`<${tag}>\`) as a HELIO Control.
 *
 * Generated by \`scripts/create-element.mjs\` from the OpenBridge custom
 * elements manifest.${
   skipped.length
     ? `\n *\n * Not generated (add manually if needed):\n${skipped.map((s) => ` * - \`${s.name}\` (${s.type}) – ${s.reason}`).join('\n')}`
     : ''
 }
 */
export const ${elementVar} = createElement(namespace, {
  name: ${q(`OpenBridge ${displayName}`)},
  description: ${q(elementDescription)},
  category: 'OpenBridge',
  icon: { name: ${q(icon)} },

  traits: [traits.Control],

  propsGroups: {
${[...groups].map(([key, g]) => `    ${key}: { label: ${q(g.label)}${g.defaultClosed ? ', defaultClosed: true' : ''} },`).join('\n')}
  },

  propsSchema: createPropsSchema().initial({
${schemaProps.map((p) => `    ${schemaEntry(p)}`).join('\n')}
    onClick: props.Action({
      label: 'On click',
      propGroup: 'interaction',
      optional: true,
    }),
  }),

  Component(p) {
    const renderMode = useRenderMode();

${dpProps.map((p) => `    const ${dpVar(p.key)} = useDynamicProperty(p.${p.key}, { valueType: ${readerFor[p.kind]} });`).join('\n')}

    const onClick = useAction(p.onClick);

${
  dpProps.length
    ? `    // Dynamic properties need to be mounted to subscribe to value changes.
    const subscriptions = [${dpProps.map((p) => dpVar(p.key)).join(', ')}];
`
    : ''
}
${primaryReads}

    const clickable = onClick.canCall === true && renderMode !== 'PreviewEdit';

    return (
      <Fragment>
${
  dpProps.length
    ? `        {subscriptions.map((dp, index) => (
          <Fragment key={index}>{dp.render()}</Fragment>
        ))}
`
    : ''
}        {onClick.render()}

        <${Name}
${componentAttributes}
          onClick={clickable ? onClick.call : undefined}
        />
      </Fragment>
    );
  },
});
`.replace('__HELPERS__', () =>
  usedHelpers.size
    ? `import { ${[...usedHelpers].sort().join(', ')} } from '../utils/valueMapping';\n`
    : '',
);

// Stories

const storyArgs = [];
if (has('state')) storyArgs.push(`state: 'active' as ${propsType}['state']`);
for (const n of primaryNames) {
  const m = members.find((x) => x.name === n);
  storyArgs.push(`${n}: ${m.default && m.default !== 0 ? literal(m.default) : 42}`);
}

const argTypes = members
  .filter((m) => m.kind === 'enum' || m.kind === 'state' || m.kind === 'priority')
  .map((m) => {
    const options =
      m.kind === 'state'
        ? ['active', 'loading', 'off']
        : m.kind === 'priority'
          ? ['regular', 'enhanced']
          : m.options;
    return `    ${m.name}: { control: 'select', options: [${options.map(q).join(', ')}] },`;
  })
  .concat(primaryNames.map((n) => `    ${n}: { control: 'number' },`));

const storiesSource = `import type { Meta, StoryObj } from '@storybook/react-vite';
import { ${Name}, type ${propsType} } from './${Name}';

const meta = {
  title: ${q(`OpenBridge/${displayName}`)},
  component: ${Name},
  // The container size comes from \`parameters.size\`, so stories can show how
  // the instrument auto-sizes to its container.
  parameters: { size: { width: ${shape === 'square' ? 420 : 640}, height: ${shape === 'square' ? 420 : 160} } },
  decorators: [
    (Story, { parameters }) => (
      <div style={{ ...parameters.size, outline: '1px dashed #999' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
${argTypes.join('\n')}
  },
  args: {
${storyArgs.map((a) => `    ${a},`).join('\n')}
  } satisfies ${propsType},
} satisfies Meta<typeof ${Name}>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ${shape === 'square' ? 'WideContainer' : 'SmallContainer'}: Story = {
  parameters: { size: { width: ${shape === 'square' ? 640 : 320}, height: ${shape === 'square' ? 240 : 96} } },
};
${
  has('state')
    ? `
export const Loading: Story = {
  args: { state: 'loading' as ${propsType}['state'] },
};
`
    : ''
}`;

// Docs

const kindLabel = {
  dpNumber: 'DP NumericValue',
  dpBoolean: 'DP Boolean',
  dpString: 'DP String',
  enum: 'Enum',
};

const docsSource = `# OpenBridge ${displayName} – HELIO Extension Element

Generated by \`scripts/create-element.mjs\` from \`<${tag}>\`. Shared patterns
(CSS import, AutoSizer, value mapping, DP resolution, pitfalls) are described
in [openbridge-compass.md](./openbridge-compass.md).

- OpenBridge docs: <https://openbridge-storybook.web.app/?path=/docs/instruments-${shortTag}--docs>
- Typings: \`node_modules/@oicl/openbridge-webcomponents/dist/${modulePath}.d.ts\`

## Files

\`\`\`
src/components/${Name}.tsx
src/components/${Name}.stories.tsx
src/elements/${Name}Element.tsx      (export \`${elementVar}\`)
\`\`\`

Sizing: **${shape}** (${shape === 'square' ? 'largest square that fits the container' : 'fills the container'}).
${primaryNames.length ? `Main value${primaryNames.length > 1 ? 's' : ''}: ${primaryNames.map((n) => `\`${n}\``).join(', ')} – required, and the instrument shows \`loading\` while ${primaryNames.length > 1 ? 'any of them is' : 'it is'} unreadable.` : 'No main value – the state only follows "Instrument off" / "Instrument loading".'}

Unset optional props are **not passed** to the web component, so its own
defaults apply (the React wrapper would otherwise overwrite them with
\`undefined\`).

## Properties

| Key | IDE label | Kind | Group | obc prop |
|---|---|---|---|---|
${schemaProps
  .map(
    (p) =>
      `| \`${p.key}\` | ${p.label.replace(/\|/g, '\\|')} | ${kindLabel[p.kind]}${p.optional ? ' opt' : `, default \`${formatDefault(p.defaultValue)}\``} | ${groups.get(p.group)?.label ?? p.group} | ${p.member ? `\`${p.member.name}\`` : p.key.startsWith('is') ? '`state`' : 'advice zone'} |`,
  )
  .join('\n')}
| \`onClick\` | On click | Action opt | Interaction | – |
${
  skipped.length
    ? `
## Not generated

These \`<${tag}>\` properties have types the generator cannot map to HELIO
props; add them by hand in \`${Name}Element.tsx\` if needed:

${skipped.map((s) => `- \`${s.name}\` (\`${s.type}\`) – ${s.reason}`).join('\n')}
`
    : ''
}`;

// ── Write files ──────────────────────────────────────────────────────────

const files = [
  [`src/components/${Name}.tsx`, componentSource],
  [`src/components/${Name}.stories.tsx`, storiesSource],
  [`src/elements/${Name}Element.tsx`, elementSource],
  [`docs/openbridge-${shortTag}.md`, docsSource],
];

if (args['dry-run']) {
  for (const [file, source] of files) console.log(`\n── ${file} ──\n${source}`);
  process.exit(0);
}

for (const [file] of files) {
  if (existsSync(resolve(root, file)) && !args.force) {
    fail(`${file} already exists. Use --force to overwrite.`);
  }
}
for (const [file, source] of files) writeFileSync(resolve(root, file), source);

// Register in main.tsx
const mainPath = resolve(root, 'src/main.tsx');
let main = readFileSync(mainPath, 'utf8');
if (!main.includes(`./elements/${Name}Element'`)) {
  const importLine = `import { ${elementVar} } from './elements/${Name}Element';\n`;
  const lastElementImport = [...main.matchAll(/^import .* from '\.\/elements\/.*';\n/gm)].pop();
  const insertAt = lastElementImport
    ? lastElementImport.index + lastElementImport[0].length
    : main.indexOf('\n', main.lastIndexOf("import '")) + 1;
  main = main.slice(0, insertAt) + importLine + main.slice(insertAt);
  main = main.replace(/elements:\s*\[([^\]]*)\]/, (_, list) => {
    const items = list
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return `elements: [${[...items, elementVar].join(', ')}]`;
  });
  writeFileSync(mainPath, main);
}

const written = [...files.map(([file]) => file), 'src/main.tsx'];
execFileSync('npx', ['prettier', '--write', ...written], { cwd: root, stdio: 'ignore' });

console.log(`\x1b[32mCreated OpenBridge ${displayName} (<${tag}>)\x1b[0m`);
for (const file of written) console.log(`  ${relative(root, resolve(root, file))}`);
console.log(`  shape: ${shape}, main value: ${primaryNames.join(', ') || '–'}, icon: ${icon}`);
if (skipped.length) {
  console.log('\nNot generated (unsupported types, add manually if needed):');
  for (const s of skipped) console.log(`  - ${s.name}: ${s.type}`);
}
console.log('\nNext: npm run check && npm run lint && npm run storybook');
