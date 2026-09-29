import {
  CompassDirection,
  CompassPriorityElement,
  CompassReadoutSource,
  type CompassCenterReadout,
} from '@oicl/openbridge-webcomponents/dist/navigation-instruments/compass/compass.js';
import { InstrumentState } from '@oicl/openbridge-webcomponents/dist/navigation-instruments/types.js';
import {
  AdviceType,
  type AngleAdvice,
} from '@oicl/openbridge-webcomponents/dist/navigation-instruments/watch/advice.js';

// Pure helpers that translate loosely typed HELIO values (dynamic properties
// can deliver anything a PLC/OPC UA variable produces) into the strongly typed
// inputs of `<obc-compass>`. Kept free of React/HELIO so they are unit-testable.

export type ObcTheme = 'bright' | 'day' | 'dusk' | 'night';

export const OBC_THEMES: readonly ObcTheme[] = ['bright', 'day', 'dusk', 'night'];

/** Returns a finite number, or `undefined` for anything else (incl. numeric strings that are empty). */
export function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

/** Interprets booleans, numbers (0 = false) and strings like "true"/"on"/"1". */
export function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value !== 0 : undefined;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'on', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'off', 'no'].includes(normalized)) return false;
  }
  return undefined;
}

/** Wraps any angle into the range [0, 360). */
export function normalizeAngle(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

function normalizeKey(value: string): string {
  return value.replace(/[\s_-]/g, '').toLowerCase();
}

/**
 * Accepts `northUp` / `headingUp` / `courseUp` (case, spaces, dashes ignored),
 * short forms `N`, `H`, `C`, or the indices 0, 1, 2 – handy when the mode comes
 * from an integer PLC variable.
 */
export function parseDirection(value: unknown): CompassDirection | undefined {
  if (typeof value === 'number') {
    return [CompassDirection.NorthUp, CompassDirection.HeadingUp, CompassDirection.CourseUp][
      value
    ];
  }
  if (typeof value !== 'string') return undefined;

  switch (normalizeKey(value)) {
    case 'northup':
    case 'north':
    case 'n':
    case '0':
      return CompassDirection.NorthUp;
    case 'headingup':
    case 'heading':
    case 'h':
    case '1':
      return CompassDirection.HeadingUp;
    case 'courseup':
    case 'course':
    case 'c':
    case '2':
      return CompassDirection.CourseUp;
    default:
      return undefined;
  }
}

export function parseTheme(value: unknown): ObcTheme | undefined {
  if (typeof value === 'number') return OBC_THEMES[value];
  if (typeof value !== 'string') return undefined;
  const normalized = normalizeKey(value);
  return OBC_THEMES.find((theme) => theme === normalized);
}

/**
 * Parses a comma/space separated list like `"hdg, cog"` into the compass
 * elements that are drawn with the enhanced (blue) priority color.
 */
export function parsePriorityElements(value: unknown): CompassPriorityElement[] {
  if (typeof value !== 'string') return [];
  const allowed = Object.values(CompassPriorityElement) as string[];
  const elements = value
    .split(/[\s,;|]+/)
    .map((part) => part.trim().toLowerCase())
    .filter((part) => allowed.includes(part)) as CompassPriorityElement[];
  return [...new Set(elements)];
}

export type InstrumentStateInput = {
  /** Explicit "instrument off" signal, e.g. sensor powered down. */
  isOff: boolean | undefined;
  /** Explicit "loading" signal. */
  isLoading: boolean | undefined;
  /** Whether the heading value is currently readable/available. */
  headingAvailable: boolean;
};

/**
 * Derives the instrument state. Explicit signals win; otherwise the compass
 * shows `loading` while the heading has no value yet (e.g. connection pending).
 */
export function deriveInstrumentState(input: InstrumentStateInput): InstrumentState {
  if (input.isOff) return InstrumentState.off;
  if (input.isLoading) return InstrumentState.loading;
  if (!input.headingAvailable) return InstrumentState.loading;
  return InstrumentState.active;
}

export type AdviceZoneInput = {
  type: AdviceType;
  enabled: boolean | undefined;
  min: number | undefined;
  max: number | undefined;
  hinted: boolean | undefined;
};

/** Builds the heading advice arcs; incomplete or disabled zones are skipped. */
export function buildAdvices(zones: AdviceZoneInput[]): AngleAdvice[] {
  return zones.flatMap((zone) => {
    if (zone.enabled === false || zone.min === undefined || zone.max === undefined) return [];
    return [
      {
        type: zone.type,
        minAngle: normalizeAngle(zone.min),
        maxAngle: normalizeAngle(zone.max),
        hinted: zone.hinted ?? false,
      },
    ];
  });
}

export const CENTER_DISPLAY_OPTIONS = [
  'Vessel image',
  'HDG',
  'COG',
  'HDG / COG',
  'HDG / COG / ROT',
  'HDG / ROT',
] as const;

export type CenterDisplay = (typeof CENTER_DISPLAY_OPTIONS)[number];

/** Maps the center display option to the compass `centerReadouts` configuration. */
export function buildCenterReadouts(
  display: CenterDisplay | undefined,
  fractionDigits: number | undefined,
): CompassCenterReadout[] {
  const sourcesByDisplay: Record<CenterDisplay, CompassReadoutSource[]> = {
    'Vessel image': [],
    HDG: [CompassReadoutSource.hdg],
    COG: [CompassReadoutSource.cog],
    'HDG / COG': [CompassReadoutSource.hdg, CompassReadoutSource.cog],
    'HDG / COG / ROT': [
      CompassReadoutSource.hdg,
      CompassReadoutSource.cog,
      CompassReadoutSource.rot,
    ],
    'HDG / ROT': [CompassReadoutSource.hdg, CompassReadoutSource.rot],
  };

  return (sourcesByDisplay[display ?? 'Vessel image'] ?? []).map((source) => ({
    source,
    ...(fractionDigits !== undefined ? { fractionDigits } : {}),
  }));
}

const CARDINAL_16 = [
  'N',
  'NNE',
  'NE',
  'ENE',
  'E',
  'ESE',
  'SE',
  'SSE',
  'S',
  'SSW',
  'SW',
  'WSW',
  'W',
  'WNW',
  'NW',
  'NNW',
] as const;

/** Converts an angle to a 4-, 8- or 16-point compass rose name. */
export function toCardinalDirection(degrees: number, points: 4 | 8 | 16 = 16): string {
  const step = 16 / points;
  const index = Math.round(normalizeAngle(degrees) / (360 / points)) % points;
  return CARDINAL_16[index * step];
}
