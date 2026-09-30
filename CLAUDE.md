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
```

CI (`.github/workflows`) runs build, lint and test.

## Architecture

Each instrument is split into **exactly two files**:

- `src/components/<Name>.tsx` – plain React component with fully resolved,
  strongly typed props. Wraps the OpenBridge React wrapper
  (`@oicl/openbridge-webcomponents-react/...`) inside `utils/AutoSizer`, which
  measures the container and renders the instrument as a square of
  `min(width, height)` (OpenBridge's `faceDiameter` is intentionally not used).
  Also re-exports the OpenBridge enums the element needs.
- `src/elements/<Name>Element.tsx` – the HELIO element (`createElement`): props
  schema plus `Component`, which resolves every `useDynamicProperty`, mounts
  every DP's `render()` (needed for subscriptions), coerces values and passes
  them to the component.

Plus a `<Name>.stories.tsx` next to the component, a doc in `docs/`, and
registration in `src/main.tsx`.

Shared code:

- `src/utils/valueMapping.ts` – coercion of loosely typed HELIO values
  (`toFiniteNumber`, `toBoolean`, `optionalNumber/optionalBoolean(ref, dp)`,
  `deriveInstrumentState`, `buildAngleAdvices`, `buildLinearAdvices`). Use
  these in new elements rather than duplicating.
- `src/dynamicProperties/` – standalone HELIO dynamic properties;
  `angleMath.ts` holds `normalizeAngle` / `toCardinalDirection`, which the
  elements also use.

Styling: `@oicl/openbridge-webcomponents/dist/openbridge.css` is imported once
in `src/main.tsx` and injected into `<head>` by `rollup-plugin-import-css`
(`inject: true`). `.storybook/preview.tsx` imports it the same way. There is no
theming/palette switching – the default (day) palette is used. Component
styles use the SDK's `className()` / `cx()` helpers.

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
