# OpenBridge Compass – HELIO Extension Element

Reference and step-by-step rebuild guide for the **OpenBridge Compass** HELIO
control and its two companion dynamic properties (**Angle Conversion** and
**Cardinal Direction**).

The goal of this document is that you can re-implement the element in another
HELIO extension project from scratch, understand every design decision, and
avoid the pitfalls that were found while building it.

---

## Table of contents

1. [What it is](#1-what-it-is)
2. [Architecture](#2-architecture)
3. [Dependencies and project setup](#3-dependencies-and-project-setup)
4. [Step 1 – Theme CSS (design tokens)](#4-step-1--theme-css-design-tokens)
5. [Step 2 – `OpenBridgeScope` component](#5-step-2--openbridgescope-component)
6. [Step 3 – Mapping helpers (`compassMapping.ts`)](#6-step-3--mapping-helpers-compassmappingts)
7. [Step 4 – Presentational component (`CompassView.tsx`)](#7-step-4--presentational-component-compassviewtsx)
8. [Step 5 – The HELIO element (`compassElement.tsx`)](#8-step-5--the-helio-element-compasselementtsx)
9. [Step 6 – Companion dynamic properties](#9-step-6--companion-dynamic-properties)
10. [Step 7 – Register everything in `main.tsx`](#10-step-7--register-everything-in-maintsx)
11. [Step 8 – Tests and Storybook](#11-step-8--tests-and-storybook)
12. [Property reference](#12-property-reference)
13. [`<obc-compass>` API cheat sheet](#13-obc-compass-api-cheat-sheet)
14. [Pitfalls and gotchas](#14-pitfalls-and-gotchas)
15. [Porting checklist](#15-porting-checklist)

---

## 1. What it is

A HELIO **Control** (usable on Dashboards, Widgets and Parameter pages) that
renders the OpenBridge `<obc-compass>` web component: a maritime compass
showing

- heading (HDG) and course over ground (COG) arrows,
- a heading setpoint marker with "at setpoint" detection,
- rate of turn (ROT) as spinning dots or a bar,
- advice and caution arcs,
- wind and current indicators,
- a vessel silhouette or numeric center readouts,
- four OpenBridge colour palettes (bright / day / dusk / night).

Almost every input is a **HELIO DynamicProperty**, so every value can be bound
to a data variable, a static value, or another dynamic property, and can change
at runtime (e.g. switch day/night palette from a PLC variable).

Links:

- HELIO SDK docs: <https://sdk.v1.docs.helio-hmi.com/>
- OpenBridge Storybook: <https://openbridge-storybook.web.app/>
- `<obc-compass>` source typings:
  `node_modules/@oicl/openbridge-webcomponents/dist/navigation-instruments/compass/compass.d.ts`

---

## 2. Architecture

```
HELIO IDE / Runtime
        │  props (DynamicPropertyRefs, enums, numbers, action)
        ▼
compassElement.tsx          ← HELIO element: schema + useDynamicProperty hooks
        │  resolves every DP → raw value, coerces types, applies defaults
        │  (uses pure helpers from compassMapping.ts)
        ▼
CompassView.tsx             ← plain React component, strongly typed props
        │
        ├── OpenBridgeScope.tsx   ← injects scoped theme CSS once,
        │                           sets data-obc-theme on a wrapper <div>
        ▼
<ObcCompass>                ← React wrapper (@oicl/openbridge-webcomponents-react)
        ▼
<obc-compass>               ← Lit web component (@oicl/openbridge-webcomponents)
```

Why three layers?

| Layer | Knows about HELIO? | Knows about OpenBridge? | Testable without HELIO? |
|---|---|---|---|
| `compassMapping.ts` | no | enums only | yes (unit tests) |
| `CompassView.tsx` | only `className` helper | yes | yes (Storybook) |
| `compassElement.tsx` | yes | via the other two | no (needs HELIO runtime) |

Keeping the HELIO-specific part thin means most of the logic can be tested
locally, because the HELIO SDK package in `node_modules` is only a **mock** (the
real implementation is injected by HELIO at runtime as the global `HELIO.v1`).

### File list

```
scripts/extract-openbridge-theme.mjs          build-time token extractor
src/openbridge/openbridgeTheme.generated.ts   generated CSS string (do not edit)
src/openbridge/OpenBridgeScope.tsx            theme wrapper
src/compass/compassMapping.ts                 pure helpers (parsing, coercion)
src/compass/CompassView.tsx                   presentational component
src/compass/CompassView.stories.tsx           Storybook stories
src/compass/compassElement.tsx                HELIO element
src/dynamicProperties/angleMath.ts            pure angle conversion math
src/dynamicProperties/angleConversion.tsx     "Angle Conversion" DP
src/dynamicProperties/cardinalDirection.tsx   "Cardinal Direction" DP
src/tests/compassMapping.test.ts              unit tests
src/main.tsx                                  extension registration
```

---

## 3. Dependencies and project setup

Start from the HELIO extension template (rollup + TypeScript + Storybook +
Vitest).

```bash
npm i @oicl/openbridge-webcomponents@^2 @oicl/openbridge-webcomponents-react@^2
npm i -D postcss@^8          # only used by the theme extraction script
```

`@oicl/openbridge-webcomponents-react` depends on `@lit/react`, which pulls
in `lit`. These are **bundled** into the extension; only `react`,
`react/jsx-runtime` and `@hmiproject/helio-sdk` stay external.

### Rollup config requirements

The template's `rollup.config.mjs` already has what is needed; make sure your
target project has the same:

```js
external: ['react', 'react/jsx-runtime', '@hmiproject/helio-sdk'],
plugins: [
  // OpenBridge + Lit read process.env.NODE_ENV – it must be replaced,
  // otherwise the bundle crashes in the browser ("process is not defined").
  replace({ preventAssignment: true, 'process.env.NODE_ENV': JSON.stringify('production') }),
  nodeResolve({}),
  commonjs({}),
  typescript({}),
  externalGlobals({
    'react/jsx-runtime': '$',
    '@hmiproject/helio-sdk': 'HELIO.v1',
    react: 'React',
  }),
],
```

### Imports

The OpenBridge packages have **no `exports` map**, so deep imports work and are
the recommended way (only the used components end up in the bundle):

```ts
// Web component classes + enums
import { CompassDirection, HdgArrowStyle, CogArrowStyle, CompassReadoutSource,
         CompassPriorityElement } from '@oicl/openbridge-webcomponents/dist/navigation-instruments/compass/compass.js';
import { InstrumentState, Priority } from '@oicl/openbridge-webcomponents/dist/navigation-instruments/types.js';
import { AdviceType } from '@oicl/openbridge-webcomponents/dist/navigation-instruments/watch/advice.js';
import { VesselImage } from '@oicl/openbridge-webcomponents/dist/navigation-instruments/watch/vessel.js';
import { RotType, RotPosition } from '@oicl/openbridge-webcomponents/dist/navigation-instruments/rate-of-turn/rot-renderer.js';

// React wrapper (created with @lit/react createComponent)
import { ObcCompass } from '@oicl/openbridge-webcomponents-react/navigation-instruments/compass/compass.js';
```

Importing the component module registers the custom element `obc-compass`
as a side effect. OpenBridge's decorator ignores duplicate registrations, so
two extensions bundling OpenBridge do not crash each other (first one wins).

---

## 4. Step 1 – Theme CSS (design tokens)

### The problem

OpenBridge components take **all** colours, sizes and fonts from CSS custom
properties defined in `dist/openbridge.css` (≈788 KB). That file:

- defines tokens on `:root` and `:root[data-obc-theme="day|night|…"]`, i.e. it
  expects to own the whole page (`<html data-obc-theme="day">`),
- contains global rules (`* { … }`, radio-button classes, icon data URLs).

Inside HELIO we do not own the page, so loading it globally would restyle
HELIO itself. Without the tokens, the compass renders colourless.

### The solution

A Node script (`scripts/extract-openbridge-theme.mjs`, run via
`npm run generate:theme`) that:

1. Parses `openbridge.css` with **postcss**.
2. Keeps only top-level rules whose selector is `:root`, `*`,
   `.obc-component-size-regular`, or `:root[data-obc-theme="X"]`, plus all
   `@property` at-rules.
3. **Rescopes** selectors:
   - `:root`, `*`, `.obc-component-size-regular` → `.obc-helio-scope`
   - `:root[data-obc-theme="X"]` → `.obc-helio-scope[data-obc-theme="X"]`
4. Drops every declaration that is not a custom property (`--*`) and every
   `--icon-*` token (large SVG data URLs, unused by the compass).
5. **Prunes unused tokens**: scans all `.js` files under
   `@oicl/openbridge-webcomponents/dist` for `--token-name` strings, keeps
   those tokens plus any token whose name starts with a dynamically-built
   prefix (`--instrument-`, `--flash-`; found by grepping for
   `` `--instrument-${`` in the dist), then adds the transitive closure of
   `var(--…)` references between tokens.
6. Minifies whitespace and writes
   `src/openbridge/openbridgeTheme.generated.ts`:

```ts
export const OPENBRIDGE_SCOPE_CLASS = 'obc-helio-scope';
export const openbridgeThemeCss = ".obc-helio-scope{--…}…";
```

Result: ≈150 KB instead of 788 KB, and nothing leaks outside the element.

Add to `package.json`:

```json
"scripts": {
  "generate:theme": "node scripts/extract-openbridge-theme.mjs",
  ...
}
```

**Re-run it after every OpenBridge upgrade** and commit the generated file
(rollup and Storybook both import it as a normal TS module; no CSS loader
needed).

> Why custom properties work through the wrapper: CSS custom properties
> **inherit**, including into shadow DOM. Setting them on a wrapper `<div>` is
> enough for the `<obc-compass>` shadow root to see them.

---

## 5. Step 2 – `OpenBridgeScope` component

`src/openbridge/OpenBridgeScope.tsx`

Responsibilities:

1. On first render, append a single `<style id="obc-helio-theme">` with
   `openbridgeThemeCss` to `document.head` (guarded by `getElementById`, so it
   is added only once no matter how many compasses are on screen).
2. Render `<div class="obc-helio-scope …" data-obc-theme={theme}>` around the
   children.

```tsx
export function OpenBridgeScope({ theme, className, style, children }) {
  ensureOpenBridgeTheme();   // idempotent <style> injection
  return (
    <div className={[OPENBRIDGE_SCOPE_CLASS, className].filter(Boolean).join(' ')}
         data-obc-theme={theme} style={style}>
      {children}
    </div>
  );
}
```

Because the palette is an attribute on the wrapper, every element instance can
have its own palette, and switching palette is just a re-render.

Reuse this component for any other OpenBridge instrument you wrap later.

---

## 6. Step 3 – Mapping helpers (`compassMapping.ts`)

Pure functions, no React, no HELIO. They turn *loosely typed* values (a
DynamicProperty bound to a PLC/OPC UA variable can deliver strings, numbers,
booleans, `undefined`, `NaN`, …) into *strictly typed* compass inputs.

| Function | Input | Output | Rules |
|---|---|---|---|
| `toFiniteNumber(v)` | unknown | `number \| undefined` | numbers (finite only), non-empty numeric strings |
| `toBoolean(v)` | unknown | `boolean \| undefined` | booleans; numbers (`0` = false); strings `true/1/on/yes`, `false/0/off/no` (case-insensitive) |
| `normalizeAngle(deg)` | number | number in `[0, 360)` | `((d % 360) + 360) % 360` |
| `parseDirection(v)` | unknown | `CompassDirection \| undefined` | `northUp/headingUp/courseUp`, `north/heading/course`, `N/H/C`, `0/1/2` (number or string). Spaces, `_`, `-` and case are ignored. |
| `parseTheme(v)` | unknown | `'bright'\|'day'\|'dusk'\|'night' \| undefined` | names (case-insensitive) or index `0..3` |
| `parsePriorityElements(v)` | unknown | `CompassPriorityElement[]` | split on `, ; \| whitespace`, keep `hdg cog rot wind current`, dedupe |
| `deriveInstrumentState({isOff, isLoading, headingAvailable})` | | `InstrumentState` | `isOff` → `off`; else `isLoading` → `loading`; else no heading → `loading`; else `active` |
| `buildAdvices(zones)` | list of `{type, enabled, min, max, hinted}` | `AngleAdvice[]` | skip zone if `enabled === false` or min/max missing; angles normalized; `hinted` defaults to `false` |
| `buildCenterReadouts(display, fractionDigits)` | option string, number | `CompassCenterReadout[]` | see table below |
| `toCardinalDirection(deg, points)` | number, `4\|8\|16` | `'N'`, `'NNE'`, … | 16-point table, index `round(deg / (360/points)) % points`, stepped by `16/points` |

Center display options (`CENTER_DISPLAY_OPTIONS`):

| Option | `centerReadouts` sources |
|---|---|
| `Vessel image` | `[]` (shows the vessel silhouette) |
| `HDG` | `[hdg]` |
| `COG` | `[cog]` |
| `HDG / COG` | `[hdg, cog]` |
| `HDG / COG / ROT` | `[hdg, cog, rot]` |
| `HDG / ROT` | `[hdg, rot]` |

`fractionDigits` is only added to each entry when defined (OpenBridge then
uses its own default).

---

## 7. Step 4 – Presentational component (`CompassView.tsx`)

A React component with **fully resolved, strongly typed** props
(`CompassViewProps`) that renders:

```tsx
<OpenBridgeScope theme={theme} className={rootClass}>
  <ObcCompass ...all props... />
</OpenBridgeScope>
```

It also re-exports the OpenBridge enums (`CompassDirection`, `HdgArrowStyle`,
`CogArrowStyle`, `InstrumentState`, `Priority`, `RotType`, `RotPosition`,
`VesselImage`) so other files import them from one place.

### Value translation done here

| View prop | Passed to `<obc-compass>` as | Why |
|---|---|---|
| `courseOverGround: undefined` | `courseOverGround = heading` | COG arrow hides under the HDG arrow instead of pointing to 0° |
| `rateOfTurnDegreesPerMinute: undefined` | `0` | **Important:** when `undefined`, obc-compass falls back to the deprecated `rotationsPerMinute`, whose default is `1` → dots spin forever |
| `headingSetpoint: undefined` | `null` | obc-compass uses `null` for "no setpoint" |
| wind speed / direction | both `null` unless **both** are defined | obc-compass only draws wind when both are set |
| current speed / direction | same as wind | same |

### Styling

Uses the HELIO SDK `className()` helper (Emotion under the hood):

```ts
root:    { width: '100%', height: '100%', minHeight: 120, display: 'flex',
           alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box',
           fontFamily: "'Noto Sans', sans-serif" }
compass: { display: 'block', width: '100%', aspectRatio: '1 / 1', maxHeight: '100%' }
clickable: { cursor: 'pointer' }
```

- The `compass` class is only applied when `faceDiameter` is **not** set.
  With `faceDiameter`, obc-compass sizes itself.
- `aspectRatio: 1/1` + `maxHeight: 100%` is deliberate. With plain
  `height: 100%` the compass **collapses to 0 px** whenever the parent has no
  explicit height (found in Storybook; can also happen in HELIO layouts).

---

## 8. Step 5 – The HELIO element (`compassElement.tsx`)

### Element definition

```ts
createElement(namespace, {
  name: 'OpenBridge Compass',
  description: 'Maritime compass instrument (OpenBridge design system) …',
  category: 'OpenBridge',
  icon: { name: 'Compass' },            // from the HELIO Icons list
  traits: [traits.Control],             // Dashboards, Widgets, Parameter pages
  propsGroups: { navigation, setpoint, display, advice, environment, rateOfTurn, interaction },
  propsSchema: createPropsSchema().initial({ ... }),
  Component(p) { ... },
});
```

> **Never rename `name` after projects use the element** – HELIO uses it as
> the element ID unless you set an explicit `id`. Same for the namespace.

### Prop groups

`propsGroups` defines collapsible sections in the IDE properties panel; each
prop references one via `propGroup: '<key>'`.

| Key | Label | Collapsed by default |
|---|---|---|
| `navigation` | Navigation data | no |
| `setpoint` | Heading setpoint | no |
| `display` | Display | no |
| `advice` | Advice zones | yes |
| `environment` | Wind & current | yes |
| `rateOfTurn` | Rate of turn | yes |
| `interaction` | Interaction | yes |

### Choosing DynamicProperty vs. static prop

Rule used: **anything that can meaningfully change at runtime or come from the
process is a DynamicProperty**; pure look-and-feel choices with a fixed set of
options are `props.Enum` / `props.Number` (they get a proper dropdown in the
IDE, which a DynamicProperty cannot offer).

Declaring a DynamicProperty prop:

```ts
heading: props.DynamicProperty({
  label: 'Heading (HDG) [°]',
  propGroup: 'navigation',
  valueType: 'NumericValue',          // filters what can be bound in the IDE
  optional: false,
  defaultValue: dynamicProperties.StaticValue(0),
}),
courseOverGround: props.DynamicProperty({
  label: 'Course over ground (COG) [°]',
  propGroup: 'navigation',
  valueType: 'NumericValue',
  optional: true,                     // no default → undefined until configured
}),
```

`valueType` values used: `'NumericValue'` (numbers), `'Boolean'`, `'String'`,
`'PrimitiveValue'` (anything scalar – used for palette and orientation so both
strings *and* integer indices can be bound).

Enum options must be a non-empty tuple of strings. The OpenBridge enum values
are used directly:

```ts
const HDG_ARROW_STYLES = Object.values(HdgArrowStyle) as [HdgArrowStyle, ...HdgArrowStyle[]];
// only top-view silhouettes make sense in a compass:
const TOP_VESSEL_IMAGES = Object.values(VesselImage).filter((i) => i.endsWith('-top')) as [...];
```

### The Component – resolution pattern

1. **Call `useDynamicProperty` for every DP prop** (hooks must be called
   unconditionally, also for optional props that are `undefined`):

   ```ts
   const num  = { valueType: values.Number() };
   const bool = { valueType: values.Boolean() };
   const heading = useDynamicProperty(p.heading, num);
   const isOff   = useDynamicProperty(p.isOff, bool);
   const theme   = useDynamicProperty(p.theme);        // no filter: string OR number
   ```

2. **Mount every DP's `render()` output.** The SDK's own examples do this
   (`configurableAction`); it is how HELIO keeps the subscription alive. The
   docs do not state it is optional, so do it:

   ```tsx
   {subscriptions.map((dp, i) => <Fragment key={i}>{dp.render()}</Fragment>)}
   {onClick.render()}
   ```

3. **Ignore optional props that are not configured** and values that cannot be
   read, then coerce:

   ```ts
   const optionalNumber = (ref, dp) =>
     ref === undefined || dp.canRead === false ? undefined : toFiniteNumber(dp.value);
   const optionalBoolean = (ref, dp) =>
     ref === undefined || dp.canRead === false ? undefined : toBoolean(dp.value);
   ```

   Checking the *ref* (`p.xyz === undefined`) matters because the local SDK
   mock – and possibly HELIO – still returns an object for an unset prop.

4. **Apply the angle offset** to *every* angle (heading, COG, setpoint, advice
   zones, wind and current directions), then normalize:

   ```ts
   const offset = optionalNumber(p.angleOffset, angleOffset) ?? 0;
   const withOffset = (a?: number) => (a === undefined ? undefined : normalizeAngle(a + offset));
   ```

   Rate of turn and speeds are **not** offset.

5. **Derive the instrument state** – no heading value yet ⇒ `loading`:

   ```ts
   const headingRaw = heading.canRead === false ? undefined : toFiniteNumber(heading.value);
   state = deriveInstrumentState({ isOff, isLoading, headingAvailable: headingRaw !== undefined });
   ```

6. **Fallbacks** for everything (match obc-compass defaults):

   | Value | Fallback |
   |---|---|
   | theme | `'day'` |
   | direction | `northUp` |
   | autoAtHeadingSetpoint | `true` |
   | autoAtHeadingSetpointDeadband | `2` |
   | showLabels | `true` (obc-compass default is `false`; we prefer labels on) |
   | rotMaxValue | `60` |
   | priorityElements | `['hdg']` when empty/unset (obc-compass default) |
   | priority | `enhanced` if "Enhanced priority" is true, else `regular` |

7. **Click action**:

   ```ts
   const onClick = useAction(p.onClick);
   const renderMode = useRenderMode();
   const clickable = onClick.canCall === true && renderMode !== 'PreviewEdit';
   // → <CompassView onClick={clickable ? onClick.call : undefined} />
   ```

   Not clickable in the IDE edit mode so selecting the element does not fire it.

---

## 9. Step 6 – Companion dynamic properties

Both are created with `createDynamicProperty(namespace, { … })` and appear in
the IDE wherever a DP of a matching value type can be bound (including the
compass's own inputs).

### Angle Conversion (`angleConversion.tsx` + `angleMath.ts`)

Converts a source angle to compass degrees with an offset. **Writable**:
writing degrees converts back to the source unit, so it can front a setpoint
variable.

| Prop | Type | Default |
|---|---|---|
| `source` | DP `NumericValue` (required) | `DataVariable()` |
| `unit` | Enum `degrees \| radians \| mils \| gradians` | `degrees` |
| `offset` | DP `NumericValue` (optional) | – (0) |
| `normalize` | Boolean "Wrap to 0–360°" | `true` |
| `fractionDigits` | Number "Display decimals" | `1` |

Math (`DEGREES_PER_UNIT`: deg 1, rad 180/π, NATO mils 360/6400, gradians 360/400):

```
read : out = normalize ? wrap(value * k + offset) : value * k + offset
write: source = (degrees - offset) / k
```

Returned result: `valueType: values.Number()`, `value`, `displayValue`
(`"123.4°"` or `"–"`), `canRead`/`canWrite` forwarded from the source,
`meta: { unit: '°' }`, `setValue` (ignores non-finite input), and a `render()`
that renders the inner `source.render()` and `offset.render()`.

Options: `writable: true`, `valueTypes: ['NumericValue', 'Float']`,
`icon: { name: 'AngleMeasure' }`, `category: 'OpenBridge'`.

### Cardinal Direction (`cardinalDirection.tsx`)

Read-only; turns an angle into `N`, `NNE`, … Useful for text outputs next to the
compass ("Wind from WSW").

| Prop | Type | Default |
|---|---|---|
| `angle` | DP `NumericValue` (required) | `DataVariable()` |
| `points` | Enum `'4' \| '8' \| '16'` | `'16'` |
| `includeDegrees` | Boolean "Append degrees" | `false` → `"NNE (22°)"` when true |

Options: `writable: false`, `valueTypes: ['String', 'PrimitiveValue']`,
`icon: { name: 'Compass' }`. `render` is forwarded directly from the inner DP.

---

## 10. Step 7 – Register everything in `main.tsx`

```ts
export default createLibraryExtension({
  name: 'OpenBridge Instruments',
  description: 'OpenBridge design system navigation instruments for HELIO',
  version: '1.0.0',
  author: '…',
  minimumRequiredHelioVersion: '25.4.0',
  actions: [],
  dynamicProperties: [angleConversionProperty, cardinalDirectionProperty],
  elements: [compassElement],
});
```

Also set `name` in `package.json` (it becomes the bundle file name
`lib/<name>-<version>.js`) and a real reverse-domain namespace in
`src/namespace.ts`.

Build: `npm run build` → upload `lib/<name>-<version>.js` to HELIO.

---

## 11. Step 8 – Tests and Storybook

- **Unit tests** (`src/tests/compassMapping.test.ts`, Vitest): cover all
  coercion/parsing helpers, advice building, center readouts, cardinal
  directions and angle conversion round-trips. Run `npx vitest run`.
- **Storybook** (`src/compass/CompassView.stories.tsx`, title
  `OpenBridge/Compass`): renders `CompassView` directly (not the HELIO element,
  since the SDK is a mock). Stories: `Default`, `FullyLoaded` (heading-up,
  advice zones, wind, current, enhanced priority, ROT bar, HDG/COG/ROT
  readouts), `Night`, `Loading`. The decorator gives the story a fixed
  420×420 box. Run `npm run storybook` → <http://localhost:9001>.

What can only be verified inside HELIO: live DP subscriptions, write-back via
Angle Conversion, the click action, and IDE prop groups.

---

## 12. Property reference

Legend: **DP** = DynamicProperty, *opt* = optional. "obc prop" is the
`<obc-compass>` property it ends up in.

### Navigation data

| Key | IDE label | Kind | Required / default | obc prop | Notes |
|---|---|---|---|---|---|
| `heading` | Heading (HDG) [°] | DP NumericValue | required, `StaticValue(0)` | `heading` | offset applied; no value ⇒ state `loading` |
| `courseOverGround` | Course over ground (COG) [°] | DP NumericValue | opt | `courseOverGround` | offset applied; unset ⇒ equals heading |
| `rateOfTurn` | Rate of turn (ROT) [°/min] | DP NumericValue | opt | `rateOfTurnDegreesPerMinute` | unset ⇒ `0`; positive = starboard |
| `angleOffset` | Angle offset / variation [°] | DP NumericValue | opt | – | added to all angles |
| `isOff` | Instrument off | DP Boolean | opt | `state = off` | highest priority |
| `isLoading` | Instrument loading | DP Boolean | opt | `state = loading` | |

### Heading setpoint

| Key | IDE label | Kind | Required / default | obc prop |
|---|---|---|---|---|
| `headingSetpoint` | Heading setpoint [°] | DP NumericValue | opt | `headingSetpoint` (`null` if unset; offset applied) |
| `autoAtHeadingSetpoint` | Detect "at setpoint" automatically | DP Boolean | required, `StaticValue(true)` | `autoAtHeadingSetpoint` |
| `autoAtHeadingSetpointDeadband` | At-setpoint deadband [°] | DP NumericValue | required, `StaticValue(2)` | `autoAtHeadingSetpointDeadband` |
| `atHeadingSetpoint` | At setpoint (manual) | DP Boolean | opt | `atHeadingSetpoint` (only used when auto is off) |
| `headingSetpointOverride` | Setpoint overridden | DP Boolean | opt | `headingSetpointOverride` |
| `animateSetpoint` | Animate setpoint changes | DP Boolean | opt | `animateSetpoint` |

### Display

| Key | IDE label | Kind | Required / default | obc prop / effect |
|---|---|---|---|---|
| `theme` | Palette (bright \| day \| dusk \| night) | DP PrimitiveValue | required, `StaticValue('day')` | `data-obc-theme` on wrapper; also accepts 0–3 |
| `direction` | Orientation (northUp \| headingUp \| courseUp) | DP PrimitiveValue | required, `StaticValue('northUp')` | `direction`; also accepts N/H/C, 0–2 |
| `showLabels` | Show N/E/S/W labels | DP Boolean | required, `StaticValue(true)` | `showLabels` |
| `tickmarksInside` | Labels inside ring | DP Boolean | opt | `tickmarksInside` |
| `enhancedPriority` | Enhanced priority (blue) | DP Boolean | opt | `priority = enhanced \| regular` |
| `priorityElements` | Enhanced elements (hdg, cog, rot, wind, current) | DP String | opt | `priorityElements` (default `['hdg']`) |
| `centerDisplay` | Center display | Enum (see §6) | `Vessel image` | `centerReadouts` |
| `readoutFractionDigits` | Readout decimals | Number | opt | `centerReadouts[].fractionDigits` |
| `vesselImage` | Vessel image | Enum (`*-top` values of `VesselImage`) | `generic-top` | `vesselImage` |
| `hdgArrowStyle` | HDG arrow style | Enum `arrowHead needle vector beamLine` | `arrowHead` | `hdgArrowStyle` |
| `cogArrowStyle` | COG arrow style | Enum `arrowHead needle vector velocityVector` | `arrowHead` | `cogArrowStyle` |
| `faceDiameter` | Fixed diameter [px] (empty = fill) | Number | opt | `faceDiameter` |

### Advice zones

| Key | IDE label | Kind | Notes |
|---|---|---|---|
| `adviceEnabled` | Advice zone enabled | DP Boolean opt | unset = enabled if from/to set |
| `adviceMin` / `adviceMax` | Advice zone from / to [°] | DP NumericValue opt | both needed; offset applied |
| `adviceHinted` | Advice zone hinted | DP Boolean opt | |
| `cautionEnabled` | Caution zone enabled | DP Boolean opt | same rules, `AdviceType.caution` |
| `cautionMin` / `cautionMax` | Caution zone from / to [°] | DP NumericValue opt | |
| `cautionHinted` | Caution zone hinted | DP Boolean opt | |

obc-compass decides "triggered" itself (heading inside the arc).

### Wind & current

| Key | IDE label | Kind | obc prop |
|---|---|---|---|
| `windSpeed` | Wind speed [kn] | DP NumericValue opt | `currentWindSpeedKnots` |
| `windFromDirection` | Wind from direction [°] | DP NumericValue opt | `windFromDirection` (offset applied) |
| `currentSpeed` | Current speed [arrows] | DP NumericValue opt | `currentSpeed` (number of arrows) |
| `currentFromDirection` | Current from direction [°] | DP NumericValue opt | `currentFromDirection` (offset applied) |

Each pair is only shown when **both** values are present.

### Rate of turn

| Key | IDE label | Kind | Default | obc prop |
|---|---|---|---|---|
| `rotType` | ROT indicator | Enum `dots bar` | `dots` | `rotType` |
| `rotPosition` | ROT position | Enum `scale innerCircle` | `innerCircle` | `rotPosition` |
| `rotMaxValue` | ROT full-scale (bar) [°/min] | DP NumericValue required | `StaticValue(60)` | `rotMaxValue` |
| `rotDotAnimationFactor` | ROT dot animation gain | Number required | `18` | `rotDotAnimationFactor` |

### Interaction

| Key | IDE label | Kind | Notes |
|---|---|---|---|
| `onClick` | On click | Action opt | disabled in IDE edit mode; pointer cursor when active |

---

## 13. `<obc-compass>` API cheat sheet

Defaults from `obc-compass` v2.0.0 (constructor in `compass.js`):

| Property | Type | Default |
|---|---|---|
| `heading`, `courseOverGround` | number | `0` |
| `headingSetpoint` | `number \| null` | `null` |
| `atHeadingSetpoint` | boolean | `false` |
| `autoAtHeadingSetpoint` | boolean | `true` |
| `autoAtHeadingSetpointDeadband` | number | `2` |
| `headingSetpointAtZeroDeadband` | number | `0.5` |
| `headingSetpointOverride`, `animateSetpoint`, `touching` | boolean | `false` |
| `headingAdvices` | `AngleAdvice[]` `{minAngle, maxAngle, type, hinted}` | `[]` |
| `currentWindSpeedKnots`, `windFromDirection` | `number \| null` | `null` |
| `currentSpeed`, `currentFromDirection` | `number \| null` | `null` |
| `vesselImage` | `VesselImage` | `generic-top` |
| `centerReadouts` | `{source, label?, unit?, fractionDigits?, size?}[]` | `[]` |
| `hdgArrowStyle` / `cogArrowStyle` | enum | `arrowHead` |
| `rateOfTurnDegreesPerMinute` | `number \| undefined` | `undefined` |
| `rotationsPerMinute` (deprecated) | number | `1` |
| `rotDotAnimationFactor` | number | `18` |
| `rotType` / `rotPosition` | enum | `dots` / `innerCircle` |
| `rotMaxValue` / `rotArcExtent` | number | `60` / `60` |
| `direction` | `northUp \| headingUp \| courseUp` | `northUp` |
| `state` | `active \| loading \| off` | `active` |
| `priority` | `regular \| enhanced` | `regular` |
| `priorityElements` | `('hdg'\|'cog'\|'rot'\|'wind'\|'current')[]` | `['hdg']` |
| `showLabels`, `tickmarksInside` | boolean | `false` |
| `faceDiameter` | `number \| undefined` | `undefined` (fill container) |

The React wrapper declares **no events**, so the compass is display-only
(no drag-to-set-setpoint). Use the HELIO `onClick` action for interaction.

---

## 14. Pitfalls and gotchas

1. **Theme tokens are required.** Without the scoped CSS the compass renders
   without colours. Do not load `openbridge.css` globally in HELIO.
2. **`rateOfTurnDegreesPerMinute` must never be `undefined`** – pass `0`, or
   the deprecated `rotationsPerMinute = 1` makes the dots spin.
3. **Height collapse** – use `aspect-ratio: 1/1; max-height: 100%` rather than
   `height: 100%` on the compass.
4. **`process.env.NODE_ENV`** must be replaced at build time (rollup `replace`).
5. **The local HELIO SDK is a mock** – `useDynamicProperty` returns static
   placeholder values and `render()` returns `null`. Real behaviour only in
   HELIO.
6. **Hooks order** – always call `useDynamicProperty` for every prop, even if
   the prop is optional and unset.
7. **Stable identifiers** – element/DP `name` and the namespace are IDs;
   changing them breaks existing projects (use `id` or schema migrations
   instead, see `src/examples/elements/elementWithMigration.tsx`).
8. **Bundle size** – about 1 MB unminified: the compass transitively imports
   ~40 other OpenBridge components (readouts, menus, icons) plus 150 KB of
   tokens. Add `@rollup/plugin-terser` if size matters.
9. **Fonts** – OpenBridge is designed for *Noto Sans*. The element requests it
   via `font-family` but does not load it; the browser falls back to
   `sans-serif` if HELIO does not provide it.
10. **Licence** – `@oicl/openbridge-webcomponents` is AGPL-3.0 (commercial
    licence available to OpenBridge donors). Bundling it into a distributed
    extension has licence implications.

---

## 15. Porting checklist

- [ ] Install `@oicl/openbridge-webcomponents`, `@oicl/openbridge-webcomponents-react`, dev `postcss`
- [ ] Rollup: React/SDK external, `process.env.NODE_ENV` replaced
- [ ] Copy `scripts/extract-openbridge-theme.mjs`, add `generate:theme` script, run it
- [ ] Copy `src/openbridge/OpenBridgeScope.tsx`
- [ ] Copy `src/compass/compassMapping.ts` and `src/compass/CompassView.tsx`
- [ ] Copy `src/compass/compassElement.tsx`; adjust the `namespace` import
- [ ] Copy `src/dynamicProperties/*` (optional)
- [ ] Register element and DPs in `main.tsx`
- [ ] Set package `name`, namespace, extension `name`/`author`
- [ ] `npx tsc --noEmit && npm run lint && npx vitest run && npm run build`
- [ ] Check Storybook `OpenBridge/Compass` stories (day + night)
- [ ] Upload the bundle to HELIO and test: live values, palette switch, loading state, click action
