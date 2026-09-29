import { normalizeAngle } from '../compass/compassMapping';

export type AngleUnit = 'degrees' | 'radians' | 'mils' | 'gradians';

/** Degrees per one unit of the given angle unit (NATO mils: 6400 per turn). */
const DEGREES_PER_UNIT: Record<AngleUnit, number> = {
  degrees: 1,
  radians: 180 / Math.PI,
  mils: 360 / 6400,
  gradians: 360 / 400,
};

export type AngleConversionOptions = {
  unit: AngleUnit;
  offsetDegrees: number;
  normalize: boolean;
};

export function convertAngle(value: number, options: AngleConversionOptions): number {
  const degrees = value * DEGREES_PER_UNIT[options.unit] + options.offsetDegrees;
  return options.normalize ? normalizeAngle(degrees) : degrees;
}

export function invertAngleConversion(degrees: number, options: AngleConversionOptions): number {
  return (degrees - options.offsetDegrees) / DEGREES_PER_UNIT[options.unit];
}
