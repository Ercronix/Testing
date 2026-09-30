# OpenBridge Azimuth Thruster – HELIO Extension Element

Reference for the **OpenBridge Azimuth Thruster** HELIO control. It is built
exactly like the compass, so everything shared (CSS import, AutoSizer,
value mapping helpers, DP resolution pattern, pitfalls) is documented in
[openbridge-compass.md](./openbridge-compass.md) and only the differences are
described here.

---

## 1. What it is

A HELIO **Control** that renders the OpenBridge `<obc-azimuth-thruster>` web
component: a rotatable thruster showing

- the thruster **angle** on a 360° ring (labels `0`, `90`, `180`, `-90`),
- the **thrust** as a bar (−100 … +100 %) inside the rotated thruster,
- an **angle setpoint** and a **thrust setpoint** with "at setpoint" detection,
- angle advice/caution arcs and thrust advice/caution ranges,
- optional propeller symbols and a starboard/port (green/red) ring indicator.

Every process value is a **HELIO DynamicProperty**.

Links:

- OpenBridge Storybook: <https://openbridge-storybook.web.app/>
- Typings:
  `node_modules/@oicl/openbridge-webcomponents/dist/navigation-instruments/azimuth-thruster/azimuth-thruster.d.ts`

---

## 2. Files

```
src/components/AzimuthThruster.tsx           presentational component (uses AutoSizer)
src/components/AzimuthThruster.stories.tsx   Storybook stories
src/elements/AzimuthThrusterElement.tsx      HELIO element
src/utils/AutoSizer.tsx                      shared (see compass doc)
src/utils/valueMapping.ts                    shared (see compass doc)
```

Registered in `src/main.tsx`:

```ts
elements: [compassElement, azimuthThrusterElement],
```

### Imports

```ts
import { ObcAzimuthThruster } from '@oicl/openbridge-webcomponents-react/navigation-instruments/azimuth-thruster/azimuth-thruster.js';
import { PropellerType } from '@oicl/openbridge-webcomponents/dist/navigation-instruments/thruster/propeller.js';
import { TickmarkStyle } from '@oicl/openbridge-webcomponents/dist/navigation-instruments/watch/tickmark.js';
import type { LinearAdvice } from '@oicl/openbridge-webcomponents/dist/navigation-instruments/thruster/advice.js';
import { InstrumentState, Priority } from '@oicl/openbridge-webcomponents/dist/navigation-instruments/types.js';
```

`AzimuthThruster.tsx` re-exports `InstrumentState`, `Priority`,
`PropellerType` and `TickmarkStyle`.

---

## 3. Component (`AzimuthThruster.tsx`)

Same structure as `Compass.tsx`: `AutoSizer` → square
`<ObcAzimuthThruster style={{ width: size, height: size }}>` with
`size = min(width, height)`, plus `minHeight: 120`, Noto Sans and a pointer
cursor when clickable. All props are passed through 1:1 – the element already
delivers resolved values.

`faceDiameter` is not used (AutoSizer instead), and the deprecated `loading`
number prop and the `hasLabelSpacer` / `touching` / `new*Setpoint` props are
left at their defaults.

---

## 4. Element (`AzimuthThrusterElement.tsx`)

Resolution follows the compass pattern: call `useDynamicProperty` for every
DP, mount all `render()` outputs, read optional props via `optionalNumber` /
`optionalBoolean`, then map.

Element-specific rules:

| Value | Rule |
|---|---|
| `angle` | `normalizeAngle(raw ?? 0)` |
| `thrust` | clamped to −100 … +100, `0` when unreadable |
| state | `deriveInstrumentState` with `valueAvailable` = angle **and** thrust readable |
| `angleSetpoint` | normalized; `undefined` hides it |
| `thrustSetpoint` | clamped; `undefined` hides it |
| angle advices | `buildAngleAdvices` (angles normalized) |
| thrust advices | `buildLinearAdvices` (clamped, min/max ordered) |
| `priority` | `enhanced` if "Enhanced priority" is true, else `regular` |
| click | `onClick.call` only when `canCall` and not in `PreviewEdit` |

No angle offset is applied – bind the angle through the **Angle Conversion**
dynamic property if the source is in another unit or reference.

> Angle advice arcs are marked "triggered" by OpenBridge when the **angle
> setpoint** (not the actual angle) lies inside the arc.

---

## 5. Property reference

Legend: **DP** = DynamicProperty, *opt* = optional.

### Thruster data (`thruster`)

| Key | IDE label | Kind | Default | obc prop |
|---|---|---|---|---|
| `angle` | Angle [°] | DP NumericValue | `StaticValue(0)` | `angle` |
| `thrust` | Thrust [%] (-100 … 100) | DP NumericValue | `StaticValue(0)` | `thrust` |
| `isOff` | Instrument off | DP Boolean opt | – | `state = off` |
| `isLoading` | Instrument loading | DP Boolean opt | – | `state = loading` |

### Angle setpoint (`angleSetpoint`)

| Key | IDE label | Kind | Default | obc prop |
|---|---|---|---|---|
| `angleSetpoint` | Angle setpoint [°] | DP NumericValue opt | – | `angleSetpoint` |
| `autoAtAngleSetpoint` | Detect "at setpoint" automatically | DP Boolean | `true` | `autoAtAngleSetpoint` |
| `autoAtAngleSetpointDeadband` | At-setpoint deadband [°] | DP NumericValue | `2` | `autoAtAngleSetpointDeadband` |
| `atAngleSetpoint` | At setpoint (manual) | DP Boolean opt | `false` | `atAngleSetpoint` |
| `angleSetpointOverride` | Setpoint overridden | DP Boolean opt | `false` | `angleSetpointOverride` |

### Thrust setpoint (`thrustSetpoint`)

| Key | IDE label | Kind | Default | obc prop |
|---|---|---|---|---|
| `thrustSetpoint` | Thrust setpoint [%] | DP NumericValue opt | – | `thrustSetpoint` |
| `autoAtThrustSetpoint` | Detect "at setpoint" automatically | DP Boolean | `true` | `autoAtThrustSetpoint` |
| `autoAtThrustSetpointDeadband` | At-setpoint deadband [%] | DP NumericValue | `1` | `autoAtThrustSetpointDeadband` |
| `atThrustSetpoint` | At setpoint (manual) | DP Boolean opt | `false` | `atThrustSetpoint` |
| `thrustSetpointOverride` | Setpoint overridden | DP Boolean opt | `false` | `thrustSetpointOverride` |
| `animateSetpoint` | Animate setpoint changes | DP Boolean opt | `false` | `animateSetpoint` (both setpoints) |

### Display (`display`)

| Key | IDE label | Kind | Default | obc prop |
|---|---|---|---|---|
| `enhancedPriority` | Enhanced priority (blue) | DP Boolean opt | `false` | `priority` |
| `showLabels` | Show angle labels | DP Boolean | `true` | `showLabels` (obc default `false`) |
| `tickmarksInside` | Labels inside ring | DP Boolean opt | `false` | `tickmarksInside` |
| `tickmarkStyle` | Tickmark style | Enum `regular enhanced` | `regular` | `tickmarkStyle` |
| `primaryTickmarkInterval` | Primary tickmarks every [°] (empty = none) | Number opt | `90` | `primaryTickmarkInterval` |
| `secondaryTickmarkInterval` | Secondary tickmarks every [°] | Number opt | – | `secondaryTickmarkInterval` |
| `tertiaryTickmarkInterval` | Tertiary tickmarks every [°] | Number opt | – | `tertiaryTickmarkInterval` |
| `topPropeller` | Top propeller | Enum `none cap single` | `none` | `topPropeller` |
| `bottomPropeller` | Bottom propeller | Enum `none cap single` | `none` | `bottomPropeller` |
| `singleDirection` | Single thrust direction (half-size bar) | Boolean | `false` | `singleDirection` |
| `starboardPortIndicator` | Starboard / port indicator | Boolean | `false` | `starboardPortIndicator` |

### Angle advice zones (`angleAdvice`, collapsed)

`angleAdviceEnabled`, `angleAdviceMin`, `angleAdviceMax`, `angleAdviceHinted`
and the same four for `angleCaution*` – DP Boolean / NumericValue [°], all
optional. A zone is shown when from/to are both set and enabled is not
`false`.

### Thrust advice zones (`thrustAdvice`, collapsed)

`thrustAdviceEnabled`, `thrustAdviceMin`, `thrustAdviceMax`,
`thrustAdviceHinted` and `thrustCaution*` – same rules, values in %.

### Interaction (`interaction`, collapsed)

| Key | IDE label | Kind | Notes |
|---|---|---|---|
| `onClick` | On click | Action opt | disabled in IDE edit mode; pointer cursor when active |

---

## 6. `<obc-azimuth-thruster>` defaults (v2.0.0)

| Property | Default |
|---|---|
| `angle`, `thrust` | `0` |
| `angleSetpoint`, `thrustSetpoint` | `undefined` |
| `autoAtAngleSetpoint` / `autoAtAngleSetpointDeadband` | `true` / `2` |
| `autoAtThrustSetpoint` / `autoAtThrustSetpointDeadband` | `true` / `1` |
| `angleSetpointAtZeroDeadband` / `thrustSetpointAtZeroDeadband` | `0.5` / `0.1` |
| `primaryTickmarkInterval` | `90` |
| `showLabels`, `tickmarksInside`, `singleDirection`, `starboardPortIndicator` | `false` |
| `topPropeller`, `bottomPropeller` | `none` |
| `tickmarkStyle` | `regular` |
| `state` / `priority` | `active` / `regular` |

---

## 7. Tests and Storybook

- `src/tests/instruments.test.ts` covers the shared helpers the element uses,
  including `buildLinearAdvices`.
- Storybook `OpenBridge/Azimuth Thruster`: `Default`, `FullyLoaded`
  (advice/caution arcs, thrust caution range, enhanced priority and tickmarks,
  propellers, starboard/port indicator, reverse thrust), `WideContainer`
  (640×240 – auto-sizing) and `Loading`.
