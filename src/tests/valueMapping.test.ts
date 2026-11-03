import { InstrumentState } from '@oicl/openbridge-webcomponents/dist/navigation-instruments/types.js';
import { describe, expect, test, vi } from 'vitest';
import {
  buildAngleAdvices,
  buildLinearAdvices,
  definedProps,
  deriveInstrumentState,
  normalizeKey,
  optionalBoolean,
  optionalJson,
  optionalList,
  optionalNumber,
  optionalPrimitive,
  optionalString,
  parseEnumList,
  toBoolean,
  toFiniteNumber,
  writeValue,
  type AdviceZoneInput,
} from '../utils/valueMapping';

// A configured prop reference (the actual shape is irrelevant, only `undefined` matters).
const REF = {};
const readable = (value: unknown, canRead: boolean | undefined = true) => ({ value, canRead });
const zone = (overrides: Partial<AdviceZoneInput>): AdviceZoneInput => ({
  type: 'advice' as AdviceZoneInput['type'],
  enabled: undefined,
  min: undefined,
  max: undefined,
  hinted: undefined,
  ...overrides,
});

describe('toFiniteNumber', () => {
  test.each([
    [12.5, 12.5],
    [0, 0],
    [-3, -3],
    ['42', 42],
    [' 7 ', 7],
    ['1e3', 1000],
    ['-0.5', -0.5],
  ])('%j → %j', (input, expected) => {
    expect(toFiniteNumber(input)).toBe(expected);
  });

  test.each([NaN, Infinity, -Infinity, '', '   ', 'abc', '12px', null, undefined, true, {}, []])(
    '%j → undefined',
    (input) => {
      expect(toFiniteNumber(input)).toBeUndefined();
    },
  );
});

describe('toBoolean', () => {
  test.each([true, 1, -1, 0.5, 'true', 'TRUE', ' on ', 'yes', '1'])('%j → true', (input) => {
    expect(toBoolean(input)).toBe(true);
  });

  test.each([false, 0, 'false', 'Off', 'no', '0', ' NO '])('%j → false', (input) => {
    expect(toBoolean(input)).toBe(false);
  });

  test.each([NaN, Infinity, '', 'maybe', '2', null, undefined, {}, []])(
    '%j → undefined',
    (input) => {
      expect(toBoolean(input)).toBeUndefined();
    },
  );
});

describe('normalizeKey', () => {
  test('strips spaces, underscores and dashes and lowercases', () => {
    expect(normalizeKey('North_Up - x')).toBe('northupx');
    expect(normalizeKey('  Heading\tUp ')).toBe('headingup');
    expect(normalizeKey('')).toBe('');
  });
});

describe('optional readers ignore unconfigured or unreadable props', () => {
  const readers = {
    optionalNumber,
    optionalBoolean,
    optionalString,
    optionalPrimitive,
    optionalJson,
    optionalList: (ref: unknown, dp: ReturnType<typeof readable>) =>
      optionalList(ref, dp, 'string'),
  };

  test.each(Object.entries(readers))('%s', (_, read) => {
    expect(read(undefined, readable('1'))).toBeUndefined();
    expect(read(REF, readable('1', false))).toBeUndefined();
    // `canRead: undefined` (unknown) is treated as readable.
    expect(read(REF, readable('1', undefined))).not.toBeUndefined();
  });
});

describe('optionalNumber', () => {
  test('coerces readable values', () => {
    expect(optionalNumber(REF, readable(5))).toBe(5);
    expect(optionalNumber(REF, readable('5.5'))).toBe(5.5);
    expect(optionalNumber(REF, readable(0))).toBe(0);
  });

  test('returns undefined for values that are not numbers', () => {
    expect(optionalNumber(REF, readable('n/a'))).toBeUndefined();
    expect(optionalNumber(REF, readable({}))).toBeUndefined();
    expect(optionalNumber(REF, readable(undefined))).toBeUndefined();
  });
});

describe('optionalBoolean', () => {
  test('coerces readable values', () => {
    expect(optionalBoolean(REF, readable('on'))).toBe(true);
    expect(optionalBoolean(REF, readable(0))).toBe(false);
    expect(optionalBoolean(REF, readable(false))).toBe(false);
    expect(optionalBoolean(REF, readable('maybe'))).toBeUndefined();
  });
});

describe('optionalString', () => {
  test('keeps strings (including empty ones) and stringifies finite numbers', () => {
    expect(optionalString(REF, readable('HDG'))).toBe('HDG');
    expect(optionalString(REF, readable(''))).toBe('');
    expect(optionalString(REF, readable(12))).toBe('12');
    expect(optionalString(REF, readable(-0.5))).toBe('-0.5');
  });

  test.each([NaN, Infinity, true, null, undefined, {}, ['a']])('%j → undefined', (value) => {
    expect(optionalString(REF, readable(value))).toBeUndefined();
  });
});

describe('optionalPrimitive', () => {
  test('passes strings, finite numbers and booleans through unchanged', () => {
    expect(optionalPrimitive(REF, readable('a'))).toBe('a');
    expect(optionalPrimitive(REF, readable('3'))).toBe('3');
    expect(optionalPrimitive(REF, readable(3))).toBe(3);
    expect(optionalPrimitive(REF, readable(false))).toBe(false);
  });

  test.each([NaN, Infinity, null, undefined, {}, [1]])('%j → undefined', (value) => {
    expect(optionalPrimitive(REF, readable(value))).toBeUndefined();
  });
});

describe('optionalList', () => {
  test('number lists split on commas, semicolons, pipes and whitespace', () => {
    expect(optionalList(REF, readable('1, 2 x;3|4'), 'number')).toEqual([1, 2, 3, 4]);
    expect(optionalList(REF, readable([1, '2', 'x', NaN]), 'number')).toEqual([1, 2]);
  });

  test('boolean lists', () => {
    expect(optionalList(REF, readable('on off maybe, 1'), 'boolean')).toEqual([true, false, true]);
    expect(optionalList(REF, readable([true, 0, 'no']), 'boolean')).toEqual([true, false, false]);
  });

  test('string lists keep inner spaces and do not split on whitespace', () => {
    expect(optionalList(REF, readable('a b, c ;d|  e'), 'string')).toEqual(['a b', 'c', 'd', 'e']);
    expect(optionalList(REF, readable([1, null, undefined, 'x']), 'string')).toEqual(['1', 'x']);
  });

  test('primitive lists keep strings, numbers and booleans as they are', () => {
    expect(optionalList(REF, readable([1, 'a', true, {}, null]), 'primitive')).toEqual([
      1,
      'a',
      true,
    ]);
    expect(optionalList(REF, readable('1, a'), 'primitive')).toEqual(['1', 'a']);
  });

  test('empty strings give an empty list, other value types give undefined', () => {
    expect(optionalList(REF, readable(''), 'number')).toEqual([]);
    expect(optionalList(REF, readable(' , ;'), 'string')).toEqual([]);
    expect(optionalList(REF, readable(5), 'number')).toBeUndefined();
    expect(optionalList(REF, readable({ a: 1 }), 'string')).toBeUndefined();
  });
});

describe('optionalJson', () => {
  test('parses JSON strings', () => {
    expect(optionalJson(REF, readable('[{"a":1}]'))).toEqual([{ a: 1 }]);
    expect(optionalJson(REF, readable('42'))).toBe(42);
    expect(optionalJson(REF, readable('true'))).toBe(true);
  });

  test('passes non-string values through', () => {
    const obj = { a: 1 };
    expect(optionalJson(REF, readable(obj))).toBe(obj);
    expect(optionalJson(REF, readable(0))).toBe(0);
    expect(optionalJson(REF, readable(false))).toBe(false);
  });

  test.each(['', '   ', '{broken', 'undefined', null, undefined])('%j → undefined', (value) => {
    expect(optionalJson(REF, readable(value))).toBeUndefined();
  });
});

describe('parseEnumList', () => {
  const allowed = ['hdg', 'cog', 'rot'] as const;

  test('matches case-insensitively, deduplicates and drops unknown entries', () => {
    expect(parseEnumList('HDG, rot;foo hdg', allowed)).toEqual(['hdg', 'rot']);
    expect(parseEnumList('cog|hdg', allowed)).toEqual(['cog', 'hdg']);
  });

  test('returns the casing of the allowed values', () => {
    expect(parseEnumList('northup', ['northUp', 'headingUp'])).toEqual(['northUp']);
  });

  test('non-strings and empty strings give an empty list', () => {
    expect(parseEnumList('', allowed)).toEqual([]);
    expect(parseEnumList(1, allowed)).toEqual([]);
    expect(parseEnumList(['hdg'], allowed)).toEqual([]);
    expect(parseEnumList(undefined, allowed)).toEqual([]);
  });
});

describe('definedProps', () => {
  test('drops only undefined, keeps other falsy values', () => {
    expect(definedProps({ a: 1, b: undefined, c: false, d: 0, e: '', f: null })).toEqual({
      a: 1,
      c: false,
      d: 0,
      e: '',
      f: null,
    });
  });

  test('omits the keys entirely and does not mutate the input', () => {
    const input = { a: undefined, b: 2 };
    const result = definedProps(input);
    expect('a' in result).toBe(false);
    expect(input).toEqual({ a: undefined, b: 2 });
  });
});

describe('deriveInstrumentState', () => {
  test.each([
    [{ isOff: true, isLoading: true, valueAvailable: true }, InstrumentState.off],
    [{ isOff: true, isLoading: false, valueAvailable: false }, InstrumentState.off],
    [{ isOff: false, isLoading: true, valueAvailable: true }, InstrumentState.loading],
    [{ isOff: undefined, isLoading: undefined, valueAvailable: false }, InstrumentState.loading],
    [{ isOff: false, isLoading: false, valueAvailable: true }, InstrumentState.active],
    [{ isOff: undefined, isLoading: undefined, valueAvailable: true }, InstrumentState.active],
  ])('%j → %s', (input, expected) => {
    expect(deriveInstrumentState(input)).toBe(expected);
  });
});

describe('buildAngleAdvices', () => {
  test('normalizes angles into [0, 360) and defaults hinted to false', () => {
    expect(
      buildAngleAdvices([zone({ min: -20, max: 380 }), zone({ min: 90, max: 180, hinted: true })]),
    ).toEqual([
      { type: 'advice', minAngle: 340, maxAngle: 20, hinted: false },
      { type: 'advice', minAngle: 90, maxAngle: 180, hinted: true },
    ]);
  });

  test('keeps min/max order (arcs may wrap through 0°)', () => {
    expect(buildAngleAdvices([zone({ min: 350, max: 10 })])).toEqual([
      { type: 'advice', minAngle: 350, maxAngle: 10, hinted: false },
    ]);
  });

  test('skips disabled or incomplete zones but treats 0 as a valid bound', () => {
    expect(
      buildAngleAdvices([
        zone({ enabled: false, min: 10, max: 20 }),
        zone({ min: 10 }),
        zone({ max: 10 }),
        zone({ enabled: true, min: 0, max: 0 }),
      ]),
    ).toEqual([{ type: 'advice', minAngle: 0, maxAngle: 0, hinted: false }]);
    expect(buildAngleAdvices([])).toEqual([]);
  });
});

describe('buildLinearAdvices', () => {
  test('orders min/max and keeps negative ranges', () => {
    expect(
      buildLinearAdvices([
        zone({ type: 'caution' as AdviceZoneInput['type'], min: 80, max: 40, hinted: true }),
        zone({ min: -100, max: -20 }),
      ]),
    ).toEqual([
      { type: 'caution', min: 40, max: 80, hinted: true },
      { type: 'advice', min: -100, max: -20, hinted: false },
    ]);
  });

  test('skips disabled or incomplete zones but treats 0 as a valid bound', () => {
    expect(
      buildLinearAdvices([
        zone({ enabled: false, min: 0, max: 10 }),
        zone({ min: undefined, max: 20 }),
        zone({ min: 0, max: 0 }),
      ]),
    ).toEqual([{ type: 'advice', min: 0, max: 0, hinted: false }]);
  });
});

describe('writeValue', () => {
  test('writes to configured targets that are writable or of unknown writability', () => {
    const setValue = vi.fn();
    writeValue(REF, { canWrite: true, setValue }, 2);
    writeValue(REF, { canWrite: undefined, setValue }, 'x');
    writeValue(REF, { canWrite: true, setValue }, null);
    writeValue(REF, { canWrite: true, setValue }, 0);
    expect(setValue.mock.calls).toEqual([[2], ['x'], [null], [0]]);
  });

  test('does nothing for unconfigured or read-only targets or a missing value', () => {
    const setValue = vi.fn();
    writeValue(undefined, { canWrite: true, setValue }, 1);
    writeValue(REF, { canWrite: false, setValue }, 1);
    writeValue(REF, { canWrite: true, setValue }, undefined);
    expect(setValue).not.toHaveBeenCalled();
  });

  test('tolerates targets without setValue', () => {
    expect(() => writeValue(REF, { canWrite: true }, 1)).not.toThrow();
  });
});
