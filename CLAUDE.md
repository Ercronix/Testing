# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A HELIO HMI extension (built from the HELIO extension template) that wraps
OpenBridge design-system web components (`@oicl/openbridge-webcomponents`) as
HELIO elements and dynamic properties. The build output is a single JS file,
`lib/<package name>-<version>.js`, which is uploaded to HELIO.

## Reference docs

Check these before guessing at an API:

- HELIO SDK: <https://sdk.v1.docs.helio-hmi.com/> (elements, props, dynamic
  properties, actions, icons, traits).
- OpenBridge Storybook: <https://openbridge-storybook.web.app/>. Instrument
  pages follow the pattern
  `?path=/docs/instruments-<name>--docs`, e.g.
  <https://openbridge-storybook.web.app/?path=/docs/instruments-azimuth-thruster--docs>.
- Local source of truth for OpenBridge props and defaults: the `.d.ts` / `.js`
  files under
  `node_modules/@oicl/openbridge-webcomponents/dist/navigation-instruments/<name>/`.

## Commands

```bash
npm run build                 # rollup → lib/<name>-<version>.js
npm run check                 # tsc --noEmit
npm run lint                  # eslint on src/**/*.ts(x)
npx vitest run                # all unit tests once (`npm run test` = watch mode)
npx vitest run src/tests/instruments.test.ts -t "buildLinearAdvices"   # single test
npx prettier --write src      # formatting (single quotes, trailing commas, width 100)
npm run storybook             # http://localhost:9001
npm run create:element -- gauge-radial --name "Radial Gauge"   # generate an element
npm run create:element -- --list [instruments|indicators|automation|building-blocks|bars-graphs]
```

CI (`.github/workflows`) runs build, lint and test.

## Architecture

Each instrument is split into **exactly two files**:

- `src/components/<Name>.tsx` – plain React component with fully resolved,
  strongly typed props. Wraps the OpenBridge React wrapper
  (`@oicl/openbridge-webcomponents-react/...`). Radial instruments use
  `utils/AutoSizer`, which measures the container and renders a square of
  `min(width, height)` (OpenBridge's `faceDiameter` is intentionally not used);
  strips fill the container; automation symbols and indicators keep their
  natural size, centered.
- `src/elements/<Name>Element.tsx` – the HELIO element (`createElement`): props
  schema plus `Component`, which resolves every `useDynamicProperty`, mounts
  every DP's `render()` (needed for subscriptions), coerces values and passes
  them to the component.

Plus a `<Name>.stories.tsx` next to the component, a doc in `docs/`, and
registration in `src/main.tsx`.

**New elements are generated, not hand-written:**
`scripts/create-element.mjs` reads the OpenBridge `custom-elements.json`
manifest plus enum/interface shapes from the `.d.ts` files (following imports,
inherited members via `inheritedFrom`, and a package-wide declaration index)
and writes the component and element into `<Category>/` subfolders
(`Instruments`, `Indicators`, `Automation`, `BuildingBlocks`, `BarsGraphs`),
then runs prettier. It covers five categories, grouped like the OpenBridge
Storybook (by story title, not source folder): instruments, indicators
(navigation `*-indicator` + automation `indicator-*`, which Storybook files
under "Automation/Indicators"), automation, building blocks and bars & graphs.
Components whose Storybook group differs from their folder (e.g. `watch` →
building blocks, `bar-vertical` → bars & graphs) or that are not generated
(`alert-list`, `circular-progress`) are listed in `STORYBOOK_CATEGORY`. The
stories are not in the npm package; titles come from the
`Ocean-Industries-Concept-Lab/openbridge-webcomponents` repo.

- Options: `--primary a,b` (required main values driving `loading`),
  `--shape square|fill|intrinsic` (automation/indicators default to
  `intrinsic` = natural size, centered), `--icon`, `--force`, `--dry-run`,
  `--no-stories/--no-docs/--no-register`, `--root/--src/--main`.
- Mapping: number/boolean/string → optional DP (manifest default as fallback and
  in the label), string/numeric enums → `props.Enum`, enum arrays → String DP,
  primitive arrays → list DP (array or `"1, 2"`), mixed primitive unions →
  PrimitiveValue DP, objects/object arrays → JSON DP, `*Advice[]` → zone props,
  `state` → isOff/isLoading, `priority` → "Enhanced priority". Only DOM/template
  types are skipped ("Not generated" in the header and doc).
- Events come from the React wrapper's `.d.ts`: each becomes an Action prop;
  primitive payload fields become "→ write to" DPs, written via `writeValue`
  before the action runs. Events and click are disabled in `PreviewEdit`.
- `COMPONENT_LAYOUT` sets per-component shape/sizing: the bars and
  `watch-flat` get `fill` and receive the measured container size as their
  `width`/`height` props (not exposed in HELIO).
- Quirks: `FALLBACK_OVERRIDES` (fallback values, e.g. ROT → 0) and
  `DEFAULT_OVERRIDES` (IDE defaults, e.g. `positioning: 'button'`, because the
  default `point` renders automation symbols as a 0×0 anchor).
- Portable: finds the project root from cwd, creates folders, and writes missing
  runtime helpers (`utils/AutoSizer.tsx`, `utils/valueMapping.ts`,
  `utils/OpenBridgeTheme.tsx`, `dynamicProperties/angleMath.ts`, `namespace.ts`) from copies embedded at the
  end of the script. **After changing those files run
  `node scripts/create-element.mjs --sync-runtime`** – `src/tests/createElement.test.mjs`
  fails otherwise. It adds the `openbridge.css` import to `main.tsx`/Storybook
  preview and warns about a missing rollup CSS plugin / NODE_ENV replacement.
- It only overwrites files carrying its "Generated by" marker, so `Compass` and
  `AzimuthThruster` (hand-written) are protected even with `--force`.
- After changing the generator, regenerate every component (all five `--list`
  categories) in a throwaway project **outside `node_modules`** (Vite skips JSX
  transforms there) – e.g. `lib/.sweep`: copy `src`, `scripts`, `.storybook`,
  configs; symlink `node_modules`; use the original template `main.tsx`
  (`git show 6bb02da:src/main.tsx`, with `minimumRequiredHelioVersion` set to
  `'26.2.0'`); delete the tests – then run tsc, eslint,
  the build and a Storybook build there. Delete it afterwards (vitest would
  pick up its tests).

Generated components spread `definedProps(props)`: the React wrappers assign
every passed prop, so `undefined` would overwrite OpenBridge's own defaults.

Shared code:

- `src/utils/valueMapping.ts` – coercion of loosely typed HELIO values
  (`toFiniteNumber`, `toBoolean`, `optionalNumber/Boolean/String/Primitive/List/Json(ref, dp)`,
  `parseEnumList`, `deriveInstrumentState`, `buildAngleAdvices`,
  `buildLinearAdvices`, `writeValue`, `definedProps`). Use these in new
  elements rather than duplicating.
- `src/dynamicProperties/` – standalone HELIO dynamic properties;
  `angleMath.ts` holds `normalizeAngle` / `toCardinalDirection`, which the
  elements also use.

Styling: `@oicl/openbridge-webcomponents/dist/openbridge.css` is imported once
in `src/main.tsx` and injected into `<head>` by `rollup-plugin-import-css`
(`inject: true`). `.storybook/preview.tsx` imports it the same way. Component
styles use the SDK's `className()` / `cx()` helpers.

Theming: every element wraps its content in `<OpenBridgeTheme>`
(`src/utils/OpenBridgeTheme.tsx`). It reads the active HELIO theme with
`useDesignTokens()` and sets the OpenBridge accent CSS variables
(`--selected-*`, `--instrument-enhanced-*`, …) on a `display: contents` div;
they inherit into the components' shadow DOM. The mapping is
`OPENBRIDGE_TOKEN_MAP`; alert colours are deliberately not mapped;
`src/tests/openBridgeCss.test.mjs` fails if an OpenBridge update renames a
mapped variable. Keep the colours per element – a global variant (one
`<style>` for the whole page) was tried and dropped: in HELIO the tokens are
formulas like `hsla(var(--utilsPrimaryHue, 193) …)` that must be resolved
inside HELIO's tree, and in HELIO the primary colour stopped following theme
changes, while the per-element wrapper keeps working. Light/dark:
the tokens have no mode flag, so `openBridgePalette` derives it from the
lightness of `containerLevel1Background` and sets `data-obc-theme` (`day` /
`dusk`, see `LIGHT_PALETTE`/`DARK_PALETTE`) on `<html>` – OpenBridge only
defines palettes on `:root[data-obc-theme]`, so it cannot be scoped. Needs
`@hmiproject/helio-sdk` ≥ 1.1.0, hence `minimumRequiredHelioVersion: '26.2.0'`
(the SDK type-checks it). The Storybook decorator applies the SDK's default
tokens.

`docs/openbridge-compass.md` is the full reference (patterns, pitfalls,
property tables); `docs/openbridge-azimuth-thruster.md` documents only what
differs. Keep both in sync with code changes.

## Gotchas

- `@hmiproject/helio-sdk` in `node_modules` is a **mock**; the real SDK is the
  global `HELIO.v1` at runtime (rollup maps it, and React, as externals).
  Hooks return placeholders locally, so element behaviour can only be verified
  inside HELIO; Storybook renders the components, not the elements.
- Optional DP props must be read via `optionalNumber/optionalBoolean(p.x, dp)` –
  the mock (and possibly HELIO) returns an object even for unset props.
- `<obc-compass>`: never pass `rateOfTurnDegreesPerMinute={undefined}` (falls
  back to a deprecated prop and the ROT dots spin forever) – pass `0`.
- Element/DP `name` and the namespace in `src/namespace.ts` act as IDs; renaming
  breaks existing HELIO projects.
- Deep-import OpenBridge modules by their `dist/...js` path (the package has no
  exports map).
