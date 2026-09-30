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
