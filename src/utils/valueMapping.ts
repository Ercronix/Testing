import type { LinearAdvice } from '@oicl/openbridge-webcomponents/dist/navigation-instruments/thruster/advice.js';
import { InstrumentState } from '@oicl/openbridge-webcomponents/dist/navigation-instruments/types.js';
import type {
  AdviceType,
  AngleAdvice,
} from '@oicl/openbridge-webcomponents/dist/navigation-instruments/watch/advice.js';
import { normalizeAngle } from '../dynamicProperties/angleMath';

// Helpers shared by all instrument elements that translate loosely typed HELIO
// values (dynamic properties can deliver anything a PLC/OPC UA variable
// produces) into the strongly typed inputs of the OpenBridge components.

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

/** Lowercases and strips spaces, `_` and `-`, for lenient string matching. */
export function normalizeKey(value: string): string {
  return value.replace(/[\s_-]/g, '').toLowerCase();
}

type ReadableValue = { value: unknown; canRead: boolean | undefined };

/**
 * Reads an optional dynamic property as number. Props that are not configured
 * (`ref === undefined`) or not readable must not contribute values.
 */
export function optionalNumber(ref: unknown, dp: ReadableValue): number | undefined {
  return ref === undefined || dp.canRead === false ? undefined : toFiniteNumber(dp.value);
}

/** Boolean counterpart of {@link optionalNumber}. */
export function optionalBoolean(ref: unknown, dp: ReadableValue): boolean | undefined {
  return ref === undefined || dp.canRead === false ? undefined : toBoolean(dp.value);
}

export type InstrumentStateInput = {
  /** Explicit "instrument off" signal, e.g. sensor powered down. */
  isOff: boolean | undefined;
  /** Explicit "loading" signal. */
  isLoading: boolean | undefined;
  /** Whether the instrument's main value is currently readable/available. */
  valueAvailable: boolean;
};

/**
 * Derives the instrument state. Explicit signals win; otherwise the instrument
 * shows `loading` while its main value has no value yet (e.g. connection pending).
 */
export function deriveInstrumentState(input: InstrumentStateInput): InstrumentState {
  if (input.isOff) return InstrumentState.off;
  if (input.isLoading) return InstrumentState.loading;
  if (!input.valueAvailable) return InstrumentState.loading;
  return InstrumentState.active;
}

export type AdviceZoneInput = {
  type: AdviceType;
  enabled: boolean | undefined;
  min: number | undefined;
  max: number | undefined;
  hinted: boolean | undefined;
};

function isCompleteZone(
  zone: AdviceZoneInput,
): zone is AdviceZoneInput & { min: number; max: number } {
  return zone.enabled !== false && zone.min !== undefined && zone.max !== undefined;
}

/** Builds angle advice arcs; incomplete or disabled zones are skipped. */
export function buildAngleAdvices(zones: AdviceZoneInput[]): AngleAdvice[] {
  return zones.filter(isCompleteZone).map((zone) => ({
    type: zone.type,
    minAngle: normalizeAngle(zone.min),
    maxAngle: normalizeAngle(zone.max),
    hinted: zone.hinted ?? false,
  }));
}

/** Builds linear (e.g. thrust) advice ranges; incomplete or disabled zones are skipped. */
export function buildLinearAdvices(zones: AdviceZoneInput[]): LinearAdvice[] {
  return zones.filter(isCompleteZone).map((zone) => ({
    type: zone.type,
    min: Math.min(zone.min, zone.max),
    max: Math.max(zone.min, zone.max),
    hinted: zone.hinted ?? false,
  }));
}

/** String counterpart of {@link optionalNumber}; numbers are converted to strings. */
export function optionalString(ref: unknown, dp: ReadableValue): string | undefined {
  if (ref === undefined || dp.canRead === false) return undefined;
  if (typeof dp.value === 'string') return dp.value;
  if (typeof dp.value === 'number' && Number.isFinite(dp.value)) return String(dp.value);
  return undefined;
}

/**
 * Parses a comma/space separated list like `"hdg, cog"` into the allowed
 * values (case-insensitive, deduplicated, unknown entries dropped).
 */
export function parseEnumList<T extends string>(value: unknown, allowed: readonly T[]): T[] {
  if (typeof value !== 'string') return [];
  const parts = value
    .split(/[\s,;|]+/)
    .map((part) => allowed.find((option) => option.toLowerCase() === part.trim().toLowerCase()))
    .filter((part): part is T => part !== undefined);
  return [...new Set(parts)];
}

/**
 * Drops `undefined` entries. The OpenBridge React wrappers assign every passed
 * prop to the element, so passing `undefined` would override the component's
 * own default – leaving the prop out keeps it.
 */
export function definedProps<T extends object>(props: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(props).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

/** Reads an optional dynamic property as string, number or boolean, unchanged. */
export function optionalPrimitive(
  ref: unknown,
  dp: ReadableValue,
): string | number | boolean | undefined {
  if (ref === undefined || dp.canRead === false) return undefined;
  const { value } = dp;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  return typeof value === 'string' || typeof value === 'boolean' ? value : undefined;
}

export type ListItemType = 'number' | 'string' | 'boolean' | 'primitive';

function toListItem(value: unknown, type: ListItemType): string | number | boolean | undefined {
  if (type === 'number') return toFiniteNumber(value);
  if (type === 'boolean') return toBoolean(value);
  if (type === 'string') return value === undefined || value === null ? undefined : String(value);
  return typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number'
    ? value
    : undefined;
}

/**
 * Reads an optional dynamic property as list. Accepts an array value or a
 * separated string (`"1, 2; 3"`; number/boolean lists also split on spaces).
 * Entries that cannot be converted are dropped.
 */
export function optionalList(
  ref: unknown,
  dp: ReadableValue,
  type: ListItemType,
): Array<string | number | boolean> | undefined {
  if (ref === undefined || dp.canRead === false) return undefined;
  const { value } = dp;
  const parts = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value
          .split(type === 'number' || type === 'boolean' ? /[\s,;|]+/ : /[,;|]/)
          .map((part) => part.trim())
          .filter((part) => part !== '')
      : undefined;
  return parts
    ?.map((part) => toListItem(part, type))
    .filter((part): part is string | number | boolean => part !== undefined);
}

/**
 * Reads an optional dynamic property holding structured data: non-string
 * values (objects, arrays, booleans, numbers) are used as they are, strings are
 * parsed as JSON. Invalid JSON is ignored.
 */
export function optionalJson(ref: unknown, dp: ReadableValue): unknown {
  if (ref === undefined || dp.canRead === false) return undefined;
  const { value } = dp;
  if (typeof value !== 'string') return value ?? undefined;
  if (value.trim() === '') return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

type WritableValue = { canWrite: boolean | undefined; setValue?(nextValue: unknown): void };

/**
 * Writes a value to an optional dynamic property (e.g. an event payload into a
 * data variable). Does nothing if the prop is not configured, not writable or
 * the value is missing.
 */
export function writeValue(ref: unknown, dp: WritableValue, value: unknown): void {
  if (ref === undefined || value === undefined || dp.canWrite === false) return;
  dp.setValue?.(value);
}
