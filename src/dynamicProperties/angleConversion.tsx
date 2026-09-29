import {
  createDynamicProperty,
  createPropsSchema,
  dynamicProperties,
  props,
  useDynamicProperty,
  values,
} from '@hmiproject/helio-sdk';
import { namespace } from '../namespace';
import { convertAngle, invertAngleConversion, type AngleUnit } from './angleMath';

/**
 * Converts a raw angle source (radians, mils, signed ±180°, …) into compass
 * degrees 0–360 with an optional offset (e.g. magnetic variation or sensor
 * mounting offset). Writable: written degrees are converted back to the
 * source unit, so it can also drive a setpoint input.
 */
export const angleConversionProperty = createDynamicProperty(namespace, {
  name: 'Angle Conversion',
  description:
    'Converts an angle from radians/degrees/mils/gradians to compass degrees (0–360°) with an optional offset. Writable in both directions.',
  category: 'OpenBridge',
  icon: { name: 'AngleMeasure' },

  writable: true,
  valueTypes: ['NumericValue', 'Float'],

  propsSchema: createPropsSchema().initial({
    source: props.DynamicProperty({
      label: 'Source angle',
      valueType: 'NumericValue',
      optional: false,
      defaultValue: dynamicProperties.DataVariable(),
    }),
    unit: props.Enum({
      label: 'Source unit',
      options: ['degrees', 'radians', 'mils', 'gradians'],
      optional: false,
      defaultValue: 'degrees',
    }),
    offset: props.DynamicProperty({
      label: 'Offset [°]',
      valueType: 'NumericValue',
      optional: true,
    }),
    normalize: props.Boolean({
      label: 'Wrap to 0–360°',
      optional: false,
      defaultValue: true,
    }),
    fractionDigits: props.Number({
      label: 'Display decimals',
      optional: false,
      defaultValue: 1,
    }),
  }),

  useDynamicProperty(p) {
    const source = useDynamicProperty(p.source, { valueType: values.Number() });
    const offset = useDynamicProperty(p.offset, { valueType: values.Number() });

    const unit = p.unit as AngleUnit;
    const offsetDegrees = p.offset === undefined ? 0 : Number(offset.value ?? 0);
    const options = { unit, offsetDegrees, normalize: p.normalize };

    const raw = source.value;
    const value =
      typeof raw === 'number' && Number.isFinite(raw) ? convertAngle(raw, options) : undefined;

    return {
      valueType: values.Number(),
      value,
      displayValue: value === undefined ? '–' : `${value.toFixed(p.fractionDigits)}°`,
      canRead: source.canRead,
      canWrite: source.canWrite,
      meta: { unit: '°' },

      setValue(nextValue) {
        if (typeof nextValue !== 'number' || !Number.isFinite(nextValue)) return;
        void source.setValue(invertAngleConversion(nextValue, options));
      },

      render() {
        return (
          <>
            {source.render()}
            {offset.render()}
          </>
        );
      },
    };
  },
});
