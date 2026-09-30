import {
  createDynamicProperty,
  createPropsSchema,
  dynamicProperties,
  props,
  useDynamicProperty,
  values,
} from '@hmiproject/helio-sdk';
import { namespace } from '../namespace';
import { normalizeAngle, toCardinalDirection } from './angleMath';

/**
 * Turns an angle into a compass rose name such as "NNE" – useful for labels
 * and outputs next to the compass (e.g. "Wind from WSW").
 */
export const cardinalDirectionProperty = createDynamicProperty(namespace, {
  name: 'Cardinal Direction',
  description: 'Converts an angle in degrees into a compass point name (N, NE, ENE, …).',
  category: 'OpenBridge',
  icon: { name: 'Compass' },

  writable: false,
  valueTypes: ['String', 'PrimitiveValue'],

  propsSchema: createPropsSchema().initial({
    angle: props.DynamicProperty({
      label: 'Angle [°]',
      valueType: 'NumericValue',
      optional: false,
      defaultValue: dynamicProperties.DataVariable(),
    }),
    points: props.Enum({
      label: 'Compass points',
      options: ['4', '8', '16'],
      optional: false,
      defaultValue: '16',
    }),
    includeDegrees: props.Boolean({
      label: 'Append degrees',
      optional: false,
      defaultValue: false,
    }),
  }),

  useDynamicProperty(p) {
    const angle = useDynamicProperty(p.angle, { valueType: values.Number() });
    const raw = angle.value;
    const hasValue = typeof raw === 'number' && Number.isFinite(raw);

    const name = hasValue ? toCardinalDirection(raw, Number(p.points) as 4 | 8 | 16) : undefined;
    const displayValue =
      name === undefined
        ? '–'
        : p.includeDegrees
          ? `${name} (${Math.round(normalizeAngle(raw as number)) % 360}°)`
          : name;

    return {
      valueType: values.String(),
      value: name,
      displayValue,
      canRead: angle.canRead,
      canWrite: false,
      render: angle.render,
    };
  },
});
