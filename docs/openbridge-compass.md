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
4. [Step 1 – OpenBridge CSS](#4-step-1--openbridge-css)
5. [Step 2 – Presentational component (`Compass.tsx`)](#5-step-2--presentational-component-compasstsx)
6. [Step 3 – The HELIO element (`CompassElement.tsx`)](#6-step-3--the-helio-element-compasselementtsx)
7. [Step 4 – Companion dynamic properties](#7-step-4--companion-dynamic-properties)
8. [Step 5 – Register everything in `main.tsx`](#8-step-5--register-everything-in-maintsx)
9. [Step 6 – Tests and Storybook](#9-step-6--tests-and-storybook)
10. [Property reference](#10-property-reference)
11. [`<obc-compass>` API cheat sheet](#11-obc-compass-api-cheat-sheet)
12. [Pitfalls and gotchas](#12-pitfalls-and-gotchas)
13. [Porting checklist](#13-porting-checklist)

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
- a vessel silhouette or numeric center readouts.

Almost every input is a **HELIO DynamicProperty**, so every value can be bound
to a data variable, a static value, or another dynamic property, and can change
at runtime.

The compass always uses the OpenBridge default (**day**) palette; there is no
palette/theme switching.

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
elements/CompassElement.tsx   ← HELIO element: schema + useDynamicProperty hooks
        │  resolves every DP → raw value, coerces types, applies defaults
        │  (shared helpers from utils/valueMapping.ts)
        ▼
components/Compass.tsx        ← plain React component, strongly typed props
        │  AutoSizer measures the container → square compass of min(w, h)
        ▼
<ObcCompass>                  ← React wrapper (@oicl/openbridge-webcomponents-react)
        ▼
<obc-compass>                 ← Lit web component (@oicl/openbridge-webcomponents)
```

The design tokens (colours, sizes, fonts) come from `openbridge.css`, which is
imported once in `main.tsx` and injected into the page by rollup.

| File | Knows about HELIO? | Knows about OpenBridge? |
|---|---|---|
| `components/Compass.tsx` | only `className` / `cx` helpers | yes |
| `elements/CompassElement.tsx` | yes | enums + `Compass` |
| `utils/valueMapping.ts` | no | enums/types only |

The shared helpers in `utils/valueMapping.ts` and the compass-specific
parsers in `CompassElement.tsx` are exported and unit-tested.
This works because the HELIO SDK package in `node_modules` is only a **mock**
(the real implementation is injected by HELIO at runtime as the global
`HELIO.v1`), so importing the element file in Vitest is harmless.

### File list

```
src/main.tsx                                  extension registration + CSS import
src/components/Compass.tsx                    presentational component
src/utils/AutoSizer.tsx                       shared container-measuring util
src/components/Compass.stories.tsx            Storybook stories
src/elements/CompassElement.tsx               HELIO element + compass-specific parsers
src/utils/valueMapping.ts                     shared value coercion helpers (all instruments)
src/dynamicProperties/angleMath.ts            pure angle math (conversion, wrap, cardinal names)
src/dynamicProperties/angleConversion.tsx     "Angle Conversion" DP
src/dynamicProperties/cardinalDirection.tsx   "Cardinal Direction" DP
src/tests/instruments.test.ts                 unit tests
rollup.config.mjs                             bundling incl. CSS injection
.storybook/preview.tsx                        loads openbridge.css for Storybook
```

---

## 3. Dependencies and project setup

Start from the HELIO extension template (rollup + TypeScript + Storybook +
Vitest).

```bash
npm i @oicl/openbridge-webcomponents@^2 @oicl/openbridge-webcomponents-react@^2
npm i -D rollup-plugin-import-css@^4
```

`@oicl/openbridge-webcomponents-react` depends on `@lit/react`, which pulls
in `lit`. These are **bundled** into the extension; only `react`,
`react/jsx-runtime` and `@hmiproject/helio-sdk` stay external.

### Rollup config requirements

```js
import css from 'rollup-plugin-import-css';

external: ['react', 'react/jsx-runtime', '@hmiproject/helio-sdk'],
plugins: [
  // OpenBridge + Lit read process.env.NODE_ENV – it must be replaced,
  // otherwise the bundle crashes in the browser ("process is not defined").
  replace({ preventAssignment: true, 'process.env.NODE_ENV': JSON.stringify('production') }),
  // Injects imported stylesheets (e.g. the OpenBridge theme) into <head>.
  css({ inject: true, minify: true }),
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

## 4. Step 1 – OpenBridge CSS

OpenBridge components take **all** colours, sizes and fonts from CSS custom
properties defined in `dist/openbridge.css`. Without them the compass renders
colourless.

Import the stylesheet once at the top of `src/main.tsx`:

```ts
import '@oicl/openbridge-webcomponents/dist/openbridge.css';
```

`rollup-plugin-import-css` (with `inject: true`) turns that import into code
that appends a `<style>` element to `document.head` when the extension loads.

What the stylesheet does globally:

- defines the tokens on `:root` (default = **day** palette) and on
  `:root[data-obc-theme="bright|day|dusk|night"]`,
- sets `* { -webkit-tap-highlight-color: transparent }` and some `--font-*`
  tokens on `*`,
- defines a few `.obc-*` utility classes (radio buttons, scrollbars,
  categorical colours) that HELIO does not use.

Everything else is custom properties (`--…`), which only OpenBridge components
read, so the global import does not restyle HELIO. CSS custom properties
**inherit into shadow DOM**, which is how `<obc-compass>` sees them.

---

## 5. Step 2 – Presentational component (`Compass.tsx`)

`src/components/Compass.tsx` exports a React component with **fully resolved,
strongly typed** props (`CompassProps`). It also re-exports the OpenBridge
enums (`CompassDirection`, `HdgArrowStyle`, `CogArrowStyle`, `InstrumentState`,
`Priority`, `RotType`, `RotPosition`, `VesselImage`) so the element imports
them from one place.

```tsx
<AutoSizer className={cx(root, onClick && clickable)}>
  {({ width, height }) => {
    const size = Math.min(width, height);
    return <ObcCompass style={{ display: 'block', width: size, height: size }} … />;
  }}
</AutoSizer>
```

### AutoSizer (`src/utils/AutoSizer.tsx`)

A shared util for all instrument components. It fills its parent
(`width/height: 100%`, flex-centred, `overflow: hidden`), measures itself with
a `ResizeObserver`, and calls its render-prop child with `{ width, height }`
(exported type `Size`). An optional `className` is merged onto the wrapper.

- Children are only rendered once both dimensions are `> 0`, so a component is
  never created at zero size.
- State only updates when the size actually changes.
- The compass gets an explicit square pixel size of `min(width, height)` and
  is centred in the remaining space. This avoids the height-collapse problem
  of `height: 100%` in auto-height layouts.

`faceDiameter` of `<obc-compass>` is intentionally **not** used: it sets a
fixed intrinsic size, whereas the AutoSizer always scales to the space HELIO
gives the element.

### Value translation done here

| Component prop | Passed to `<obc-compass>` as | Why |
|---|---|---|
| `courseOverGround: undefined` | `courseOverGround = heading` | COG arrow hides under the HDG arrow instead of pointing to 0° |
| `rateOfTurnDegreesPerMinute: undefined` | `0` | **Important:** when `undefined`, obc-compass falls back to the deprecated `rotationsPerMinute`, whose default is `1` → dots spin forever |
| `headingSetpoint: undefined` | `null` | obc-compass uses `null` for "no setpoint" |
| wind speed / direction | both `null` unless **both** are defined | obc-compass only draws wind when both are set |
| current speed / direction | same as wind | same |

Via the AutoSizer's `className`, the compass adds `minHeight: 120`,
`fontFamily: "'Noto Sans', sans-serif"`, and `cursor: pointer` when an
`onClick` handler is present.

---

## 6. Step 3 – The HELIO element (`CompassElement.tsx`)

### Value mapping helpers

Pure functions turn *loosely typed* values (a DynamicProperty bound to a
PLC/OPC UA variable can deliver strings, numbers, booleans, `undefined`, `NaN`,
…) into *strictly typed* instrument inputs.

Shared by all instruments, in `src/utils/valueMapping.ts`:

| Function | Input | Output | Rules |
|---|---|---|---|
| `toFiniteNumber(v)` | unknown | `number \| undefined` | numbers (finite only), non-empty numeric strings |
| `toBoolean(v)` | unknown | `boolean \| undefined` | booleans; numbers (`0` = false); strings `true/1/on/yes`, `false/0/off/no` (case-insensitive) |
| `normalizeKey(s)` | string | string | lowercase, spaces / `_` / `-` removed |
| `optionalNumber(ref, dp)` / `optionalBoolean(ref, dp)` | prop ref + DP result | value \| `undefined` | `undefined` when the prop is not configured or not readable, else coerced |
| `deriveInstrumentState({isOff, isLoading, valueAvailable})` | | `InstrumentState` | `isOff` → `off`; else `isLoading` → `loading`; else no main value → `loading`; else `active` |
| `buildAngleAdvices(zones)` | list of `{type, enabled, min, max, hinted}` | `AngleAdvice[]` | skip zone if `enabled === false` or min/max missing; angles normalized; `hinted` defaults to `false` |
| `buildLinearAdvices(zones)` | same | `LinearAdvice[]` | same skipping; min/max ordered (used for thrust) |

Compass-specific, exported from `src/elements/CompassElement.tsx`:

| Function | Input | Output | Rules |
|---|---|---|---|
| `parseDirection(v)` | unknown | `CompassDirection \| undefined` | `northUp/headingUp/courseUp`, `north/heading/course`, `N/H/C`, `0/1/2` (number or string). Spaces, `_`, `-` and case are ignored. |
| `parsePriorityElements(v)` | unknown | `CompassPriorityElement[]` | split on `, ; \| whitespace`, keep `hdg cog rot wind current`, dedupe |
| `buildCenterReadouts(display, fractionDigits)` | option string, number | `CompassCenterReadout[]` | see table below |

`normalizeAngle` (wrap to `[0, 360)`) is imported from
`dynamicProperties/angleMath.ts`.

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
`'PrimitiveValue'` (anything scalar – used for orientation so both strings
*and* integer indices can be bound).

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
   const heading   = useDynamicProperty(p.heading, num);
   const isOff     = useDynamicProperty(p.isOff, bool);
   const direction = useDynamicProperty(p.direction);  // no filter: string OR number
   ```

2. **Mount every DP's `render()` output.** The SDK's own examples do this
   (`configurableAction`); it is how HELIO keeps the subscription alive. The
   docs do not state it is optional, so do it:

   ```tsx
   {subscriptions.map((dp, i) => <Fragment key={i}>{dp.render()}</Fragment>)}
   {onClick.render()}
   ```

3. **Ignore optional props that are not configured** and values that cannot be
   read, then coerce – via `optionalNumber` / `optionalBoolean` from
   `utils/valueMapping.ts`:

   ```ts
   export function optionalNumber(ref: unknown, dp: ReadableValue): number | undefined {
     return ref === undefined || dp.canRead === false ? undefined : toFiniteNumber(dp.value);
   }
   // usage: optionalNumber(p.courseOverGround, courseOverGround)
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
   state = deriveInstrumentState({ isOff, isLoading, valueAvailable: headingRaw !== undefined });
   ```

6. **Fallbacks** for everything (match obc-compass defaults):

   | Value | Fallback |
   |---|---|
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
   // → <Compass onClick={clickable ? onClick.call : undefined} />
   ```

   Not clickable in the IDE edit mode so selecting the element does not fire it.

---

## 7. Step 4 – Companion dynamic properties

Both are created with `createDynamicProperty(namespace, { … })` and appear in
the IDE wherever a DP of a matching value type can be bound (including the
compass's own inputs). Their shared math lives in `angleMath.ts`
(`convertAngle`, `invertAngleConversion`, `normalizeAngle`,
`toCardinalDirection`).

### Angle Conversion (`angleConversion.tsx`)

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

`toCardinalDirection(deg, points)` uses a 16-point table, index
`round(deg / (360/points)) % points`, stepped by `16/points`.

Options: `writable: false`, `valueTypes: ['String', 'PrimitiveValue']`,
`icon: { name: 'Compass' }`. `render` is forwarded directly from the inner DP.

---

## 8. Step 5 – Register everything in `main.tsx`

```ts
import { createLibraryExtension } from '@hmiproject/helio-sdk';
import '@oicl/openbridge-webcomponents/dist/openbridge.css';
import { compassElement } from './elements/CompassElement';
import { angleConversionProperty } from './dynamicProperties/angleConversion';
import { cardinalDirectionProperty } from './dynamicProperties/cardinalDirection';

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

## 9. Step 6 – Tests and Storybook

**Unit tests** (`src/tests/instruments.test.ts`, Vitest) cover the shared
helpers from `utils/valueMapping.ts` (coercion, optional values, instrument
state, angle and linear advice building), the compass parsers from
`CompassElement.tsx` (direction, priority elements, center readouts) and the angle
math from `angleMath.ts` (wrap, cardinal directions, conversion round-trips).
Run `npx vitest run`.

**Storybook** (`src/components/Compass.stories.tsx`, title `OpenBridge/Compass`)
renders the `Compass` component directly (not the HELIO element, since the SDK
is a mock). `.storybook/preview.tsx` imports `openbridge.css` the same way
`main.tsx` does; Vite handles the CSS import natively.

The container size comes from `parameters.size` (default 420×420, dashed
outline), so each story can show how the AutoSizer behaves:

| Story | Shows |
|---|---|
| `Default` | north-up, heading, COG, ROT dots, setpoint |
| `FullyLoaded` | heading-up, advice + caution zones, wind, current, enhanced priority, ROT bar, HDG/COG/ROT readouts |
| `WideContainer` | 640×240 box – compass shrinks to 240 px and centres horizontally |
| `TallContainer` | 200×480 box – compass shrinks to 200 px and centres vertically |
| `Loading` | `InstrumentState.loading` |

Run `npm run storybook` → <http://localhost:9001>.

What can only be verified inside HELIO: live DP subscriptions, write-back via Angle Conversion, the click action, and IDE prop
groups.

---

## 10. Property reference

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

Size is not a property: the compass always auto-sizes to the element's box
(see §5).

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

## 11. `<obc-compass>` API cheat sheet

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
| `faceDiameter` | `number \| undefined` | `undefined` (fill container; not used here) |

The React wrapper declares **no events**, so the compass is display-only
(no drag-to-set-setpoint). Use the HELIO `onClick` action for interaction.

---

## 12. Pitfalls and gotchas

1. **The OpenBridge CSS is required.** Without the `openbridge.css` import in
   `main.tsx` (and the rollup CSS plugin with `inject: true`) the compass
   renders without colours.
2. **`rateOfTurnDegreesPerMinute` must never be `undefined`** – pass `0`, or
   the deprecated `rotationsPerMinute = 1` makes the dots spin.
3. **Sizing** – the AutoSizer gives the compass explicit pixel dimensions.
   Plain `height: 100%` on the compass collapses to 0 px when the parent has no
   explicit height.
4. **`process.env.NODE_ENV`** must be replaced at build time (rollup `replace`).
5. **The local HELIO SDK is a mock** – `useDynamicProperty` returns static
   placeholder values and `render()` returns `null`. Real behaviour only in
   HELIO.
6. **Hooks order** – always call `useDynamicProperty` for every prop, even if
   the prop is optional and unset.
7. **Stable identifiers** – element/DP `name` and the namespace are IDs;
   changing them breaks existing projects (use `id` or schema migrations
   instead, see `src/examples/elements/elementWithMigration.tsx`).
8. **Bundle size** – about 1.6 MB unminified JS: the compass transitively
   imports ~40 other OpenBridge components (readouts, menus, icons), plus the
   full `openbridge.css` (≈788 KB source, minified on inject). Add
   `@rollup/plugin-terser` if size matters.
9. **Fonts** – OpenBridge is designed for *Noto Sans*. The element requests it
   via `font-family` but does not load it; the browser falls back to
   `sans-serif` if HELIO does not provide it.
10. **Licence** – `@oicl/openbridge-webcomponents` is AGPL-3.0 (commercial
    licence available to OpenBridge donors). Bundling it into a distributed
    extension has licence implications.

---

## 13. Porting checklist

- [ ] Install `@oicl/openbridge-webcomponents`, `@oicl/openbridge-webcomponents-react`, dev `rollup-plugin-import-css`
- [ ] Rollup: React/SDK external, `process.env.NODE_ENV` replaced, `css({ inject: true })`
- [ ] Import `@oicl/openbridge-webcomponents/dist/openbridge.css` in `main.tsx`
- [ ] Copy `src/utils/AutoSizer.tsx`, `src/utils/valueMapping.ts` and `src/components/Compass.tsx` (and `Compass.stories.tsx`; import `openbridge.css` in `.storybook/preview.tsx`)
- [ ] Copy `src/elements/CompassElement.tsx`; adjust the `namespace` import
- [ ] Copy `src/dynamicProperties/*` (`angleMath.ts` is required by the element)
- [ ] Register element and DPs in `main.tsx`
- [ ] Set package `name`, namespace, extension `name`/`author`
- [ ] `npx tsc --noEmit && npm run lint && npx vitest run && npm run build`
- [ ] Check the Storybook `OpenBridge/Compass` stories, incl. wide/tall containers
- [ ] Upload the bundle to HELIO and test: live values, auto-sizing, loading state, click action
