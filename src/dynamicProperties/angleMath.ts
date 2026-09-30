/** Wraps any angle into the range [0, 360). */
export function normalizeAngle(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

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
