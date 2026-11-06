# Icons

`scripts/create-icons.mjs` adds icons to the extension as HELIO icons
(`createIcon`), so they appear in the HELIO IDE icon selector next to the
built-in ones. It is self-contained (only needs `@hmiproject/helio-sdk`) and can
be copied into any HELIO extension. Sources:

- **Own icons** (default): `.svg` and `.png` files in `icons/` next to
  `package.json`, or another folder with `--from <dir>`.
- **OpenBridge** (`--openbridge`): every `<obi-*>` icon of
  `@oicl/openbridge-webcomponents` (2101 in 2.0.0). Registered here as
  `openBridgeIcons`.

Each run writes one **icon set** – `src/icons/<set>.generated.ts`, exporting
`const <set>` – and adds it to `icons: [...]` in `src/main.tsx`. Several sets
can live side by side (`icons: [...openBridgeIcons, ...customIcons]`).

```bash
node scripts/create-icons.mjs                          # own icons from ./icons → customIcons
node scripts/create-icons.mjs --dry-run                # show names/categories, write nothing
node scripts/create-icons.mjs --from icons/plant --category "Plant" --out plantIcons
npm run create:icons                                   # all OpenBridge icons (--openbridge)
npm run create:icons -- --list                         # OpenBridge groups with counts
npm run create:icons -- --groups "Maritime icons,UI icons / General"   # only some
```

Browse the OpenBridge icons in Storybook under **OpenBridge/Icons**.

## Files

- `src/icons/<set>.generated.ts` – icon data plus `export const <set>`.
  Generated – do not edit. Its header contains the command that regenerates it.
- `src/icons/iconData.tsx` – `createIconsFromData()`, shared by all sets: renders
  each entry as `<svg viewBox fill="currentColor">` + the stored markup and wraps
  it in `createIcon(namespace, …)`.
- `scripts/create-icons.mjs` – the generator.

Data entries are `[name, description, category index, width, height, inner SVG markup]`.

## Own icons

| HELIO field   | Value                                                                      |
| ------------- | -------------------------------------------------------------------------- |
| `name`        | file name: `pump-running.svg` / `pump_running.png` → "Pump Running"        |
| `description` | path inside the folder, e.g. `Pumps/pump-running.svg`                      |
| `category`    | `--category` (default: the extension `name`) + subfolders: "Plant / Pumps" |
| size          | scaled so the longer side is `--size` px (default 24), aspect ratio kept   |

**SVG**

- Single-color icons (one fill/stroke color, `none` and gradients aside) are
  switched to `currentColor`, so HELIO can color them like its own icons.
  Multi-color icons keep their colors; `--keep-colors` keeps them always. An
  SVG without any fill is black by default, which counts as its color.
- The root `<svg>` is replaced by the runtime's: its `viewBox` offset and
  scale become a `transform`, inherited attributes (`fill`, `stroke`,
  `stroke-width`, …) move onto a `<g>`.
- Ids and their references are prefixed (`<set>-<file>-…`). Inline `<style>`
  applies to the whole page, so class selectors and `class` attributes are
  prefixed too; element selectors (`path { … }`) cannot be scoped and produce a
  warning – export with presentation attributes instead.
- Editor metadata (XML prolog, comments, `<metadata>`, Inkscape/Sodipodi) is
  removed. `<script>` / `<foreignObject>` are refused.

**PNG**

- Embedded as `data:image/png;base64,…` (≈ 33 % larger than the file; files
  over 100 kB produce a warning).
- They keep their colors – HELIO cannot recolor them. With `--tint` the PNG's
  alpha channel is used as mask for a `currentColor` fill, which suits
  single-color icons on a transparent background.
- They are raster images: export them at 2–3× the display size.

Prefer SVG whenever a vector original exists.

## OpenBridge icons

| HELIO field   | Value                                                                        |
| ------------- | ---------------------------------------------------------------------------- |
| `name`        | derived from the OpenBridge id: `ais-proposal` → "AIS Proposal"              |
| `description` | the OpenBridge tag, e.g. `obi-ais-proposal` (searchable in the IDE)          |
| `category`    | OpenBridge's own grouping, e.g. "OpenBridge: Maritime icons / Chart targets" |
| markup        | the icon's `currentColor` variant (takes the color HELIO renders it with)    |

The script reads `dist/icons/names.js` (ids and categories) and the
`` this.icon = svg`…` `` template of each `dist/icons/icon-<id>.js`. If
OpenBridge changes that source layout the script fails with the affected file
instead of writing broken icons. Rerun it after updating
`@oicl/openbridge-webcomponents`; `src/tests/createIcons.test.mjs` fails while
the data is out of date.

## Using it in other extensions

The script is portable: copy `scripts/create-icons.mjs` into any extension
built from the HELIO template and run it there. It creates
`src/icons/iconData.tsx` (and `src/namespace.ts`) from embedded copies when they
are missing and registers the set in `main.tsx`. OpenBridge icons need
`@oicl/openbridge-webcomponents` installed; `--from` needs only the HELIO SDK.

Projects that ran the first version of the script (`src/icons/openbridgeIcons.tsx`)
are migrated on the next run: the old module is removed if unchanged and the
`main.tsx` import is repointed.

**After changing `src/icons/iconData.tsx` run
`node scripts/create-icons.mjs --sync-runtime`** – the test fails otherwise.

## Pitfalls

- **Names are IDs.** HELIO addresses icons by namespace + name. Renaming a file,
  changing `SPELLINGS`, dropping groups with `--groups`, or an OpenBridge
  update that removes an icon breaks projects that use it. Names must be
  unique across all sets – the script refuses duplicates.
- **Bundle size.** All OpenBridge icons add about 2.7 MB to `lib/*.js`. Use
  `--groups` to ship only what you need.
- **One drawing for all sizes.** HELIO passes `size` (`S`/`M`/`L`); it is
  ignored. An icon keeps its intrinsic size unless HELIO passes
  `width`/`height`/`className`, which are forwarded to the `<svg>`.
- `ais-sar-aircraft-helicopter-filled`, `ais-sar-aircraft-helicopter-iec` and
  `kitesurfing` contain `NaN` path data in OpenBridge 2.0.0 itself; browsers
  log an error and skip that segment.
