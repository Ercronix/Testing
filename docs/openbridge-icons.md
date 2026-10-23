# OpenBridge icons

All OpenBridge icons (`<obi-*>` from `@oicl/openbridge-webcomponents`, 2101 in
2.0.0) are registered as HELIO icons, so they appear in the HELIO IDE icon
selector next to the built-in ones.

| HELIO field   | Value                                                                        |
| ------------- | ---------------------------------------------------------------------------- |
| `name`        | derived from the OpenBridge id: `ais-proposal` → "AIS Proposal"              |
| `description` | the OpenBridge tag, e.g. `obi-ais-proposal` (searchable in the IDE)          |
| `category`    | OpenBridge's own grouping, e.g. "OpenBridge: Maritime icons / Chart targets" |
| `Icon`        | the icon's `currentColor` SVG (takes the color HELIO renders it with)        |

Browse them in Storybook under **OpenBridge/Icons** (`npm run storybook`).

## Files

- `src/icons/openbridgeIcons.generated.ts` – icon data (names, categories, SVG
  markup). Generated – do not edit.
- `src/icons/openbridgeIcons.tsx` – turns each entry into `createIcon(namespace, …)`;
  exports `openBridgeIcons`, registered in `src/main.tsx` as `icons: openBridgeIcons`.
- `scripts/create-icons.mjs` – the generator.

## Regenerating

```bash
npm run create:icons                                   # all icons
npm run create:icons -- --list                         # groups with counts
npm run create:icons -- --groups "Maritime icons,UI icons / General"   # only some
npm run create:icons -- --dry-run                      # show what would be written
```

Run it after updating `@oicl/openbridge-webcomponents`;
`src/tests/createIcons.test.mjs` fails while the data is out of date.

The script reads `dist/icons/names.js` (ids and categories) and the
`` this.icon = svg`…` `` template of each `dist/icons/icon-<id>.js`. It strips
the `<svg>` root (rebuilt by the component), minifies whitespace and prefixes
element ids with `obi-<id>-` so clip paths and filters of different icons on
one page cannot collide. If OpenBridge changes that source layout the script
fails with the affected file instead of writing broken icons.

Like `create-element.mjs` it is portable: it writes `src/icons/openbridgeIcons.tsx`
(and `src/namespace.ts`) from embedded copies when they are missing, and adds
the import and `icons: openBridgeIcons` to `main.tsx`. **After changing
`src/icons/openbridgeIcons.tsx` run `node scripts/create-icons.mjs --sync-runtime`.**

## Pitfalls

- **Names are IDs.** HELIO addresses icons by namespace + name. Renaming
  (changing `SPELLINGS` in the script), dropping groups with `--groups`, or an
  OpenBridge update that removes an icon breaks projects that use it.
- **Bundle size.** All icons add about 2.7 MB to `lib/*.js`. Use `--groups` to
  ship only what you need.
- **One drawing for all sizes.** HELIO passes `size` (`S`/`M`/`L`); OpenBridge
  has a single SVG per icon, so `size` is ignored. Like an imported SVG file the
  icon keeps its intrinsic size (mostly 24×24) unless HELIO passes
  `width`/`height`/`className`, which are forwarded to the `<svg>`.
- **Monochrome.** OpenBridge's alternative CSS-variable variant (`useCssColor`,
  e.g. alert colors) is not used; HELIO colors the icon.
- `ais-sar-aircraft-helicopter-filled`, `ais-sar-aircraft-helicopter-iec` and
  `kitesurfing` contain `NaN` path data in OpenBridge 2.0.0 itself; browsers
  log an error and skip that segment.
