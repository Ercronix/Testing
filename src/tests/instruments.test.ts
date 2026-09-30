import { describe, expect, test } from 'vitest';
import {
  buildCenterReadouts,
  parseDirection,
  parsePriorityElements,
} from '../elements/CompassElement';
import {
  buildAngleAdvices,
  buildLinearAdvices,
  deriveInstrumentState,
  normalizeKey,
  optionalBoolean,
  optionalNumber,
  toBoolean,
  toFiniteNumber,
} from '../utils/valueMapping';
import {
  convertAngle,
  invertAngleConversion,
  normalizeAngle,
  toCardinalDirection,
} from '../dynamicProperties/angleMath';

describe('value coercion', () => {
  test('toFiniteNumber', () => {
    expect(toFiniteNumber(12.5)).toBe(12.5);
    expect(toFiniteNumber('42')).toBe(42);
    expect(toFiniteNumber('')).toBeUndefined();
    expect(toFiniteNumber(NaN)).toBeUndefined();
    expect(toFiniteNumber(null)).toBeUndefined();
  });

  test('toBoolean', () => {
    expect(toBoolean(true)).toBe(true);
    expect(toBoolean(0)).toBe(false);
    expect(toBoolean('ON')).toBe(true);
    expect(toBoolean('off')).toBe(false);
    expect(toBoolean('maybe')).toBeUndefined();
  });

  test('normalizeKey', () => {
    expect(normalizeKey('North_Up - x')).toBe('northupx');
  });

  test('optional values ignore unconfigured or unreadable props', () => {
    expect(optionalNumber(undefined, { value: 5, canRead: true })).toBeUndefined();
    expect(optionalNumber({}, { value: 5, canRead: false })).toBeUndefined();
    expect(optionalNumber({}, { value: '5', canRead: true })).toBe(5);
    expect(optionalBoolean({}, { value: 'on', canRead: undefined })).toBe(true);
  });

  test('normalizeAngle', () => {
    expect(normalizeAngle(370)).toBe(10);
    expect(normalizeAngle(-10)).toBe(350);
    expect(normalizeAngle(360)).toBe(0);
  });
});

describe('enum parsing', () => {
  test('parseDirection accepts names, short forms and indices', () => {
    expect(parseDirection('headingUp')).toBe('headingUp');
    expect(parseDirection('Course Up')).toBe('courseUp');
    expect(parseDirection('N')).toBe('northUp');
    expect(parseDirection(1)).toBe('headingUp');
    expect(parseDirection('sideways')).toBeUndefined();
  });

  test('parsePriorityElements', () => {
    expect(parsePriorityElements('hdg, COG;cog wind foo')).toEqual(['hdg', 'cog', 'wind']);
    expect(parsePriorityElements(undefined)).toEqual([]);
  });
});

describe('instrument configuration', () => {
  test('deriveInstrumentState', () => {
    expect(deriveInstrumentState({ isOff: true, isLoading: true, valueAvailable: true })).toBe(
      'off',
    );
    expect(
      deriveInstrumentState({ isOff: false, isLoading: undefined, valueAvailable: false }),
    ).toBe('loading');
    expect(
      deriveInstrumentState({ isOff: undefined, isLoading: undefined, valueAvailable: true }),
    ).toBe('active');
  });

  test('buildAngleAdvices skips incomplete or disabled zones', () => {
    const advices = buildAngleAdvices([
      { type: 'advice' as never, enabled: undefined, min: -20, max: 20, hinted: undefined },
      { type: 'caution' as never, enabled: false, min: 10, max: 20, hinted: true },
      { type: 'caution' as never, enabled: true, min: 10, max: undefined, hinted: true },
    ]);
    expect(advices).toEqual([{ type: 'advice', minAngle: 340, maxAngle: 20, hinted: false }]);
  });

  test('buildLinearAdvices orders min/max and skips incomplete zones', () => {
    const advices = buildLinearAdvices([
      { type: 'caution' as never, enabled: true, min: 80, max: 40, hinted: true },
      { type: 'advice' as never, enabled: undefined, min: undefined, max: 20, hinted: undefined },
    ]);
    expect(advices).toEqual([{ type: 'caution', min: 40, max: 80, hinted: true }]);
  });

  test('buildCenterReadouts', () => {
    expect(buildCenterReadouts('Vessel image', 1)).toEqual([]);
    expect(buildCenterReadouts('HDG / COG', 1)).toEqual([
      { source: 'hdg', fractionDigits: 1 },
      { source: 'cog', fractionDigits: 1 },
    ]);
  });

  test('toCardinalDirection', () => {
    expect(toCardinalDirection(0)).toBe('N');
    expect(toCardinalDirection(22.5)).toBe('NNE');
    expect(toCardinalDirection(350)).toBe('N');
    expect(toCardinalDirection(250, 8)).toBe('W');
    expect(toCardinalDirection(100, 4)).toBe('E');
  });
});

describe('angle conversion', () => {
  test('converts radians with offset and wraps', () => {
    const options = { unit: 'radians' as const, offsetDegrees: 10, normalize: true };
    expect(convertAngle(Math.PI, options)).toBeCloseTo(190);
    expect(convertAngle(-Math.PI / 2, options)).toBeCloseTo(280);
  });

  test('inverse conversion round-trips', () => {
    const options = { unit: 'mils' as const, offsetDegrees: -3, normalize: false };
    expect(convertAngle(invertAngleConversion(123, options), options)).toBeCloseTo(123);
  });
});
