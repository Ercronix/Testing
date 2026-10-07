import {
  createElement,
  createPropsSchema,
  dynamicProperties,
  props,
  traits,
  useAction,
  useDynamicProperty,
  useRenderMode,
  values,
} from '@hmiproject/helio-sdk';
import { AdviceType } from '@oicl/openbridge-webcomponents/dist/navigation-instruments/watch/advice.js';
import { Fragment } from 'react';
import { OpenBridgeTheme } from '../utils/OpenBridgeTheme';
import { namespace } from '../namespace';
import { normalizeAngle } from '../dynamicProperties/angleMath';
import {
  AzimuthThruster,
  Priority,
  PropellerType,
  TickmarkStyle,
} from '../components/AzimuthThruster';
import {
  buildAngleAdvices,
  buildLinearAdvices,
  deriveInstrumentState,
  optionalBoolean,
  optionalNumber,
  toBoolean,
  toFiniteNumber,
} from '../utils/valueMapping';

const PROPELLER_TYPES = Object.values(PropellerType) as [PropellerType, ...PropellerType[]];
const TICKMARK_STYLES = Object.values(TickmarkStyle) as [TickmarkStyle, ...TickmarkStyle[]];

/** Clamps thrust values to the -100 … +100 % range the instrument can draw. */
function clampThrust(value: number | undefined): number | undefined {
  return value === undefined ? undefined : Math.max(-100, Math.min(100, value));
}

/**
 * OpenBridge azimuth thruster (`<obc-azimuth-thruster>`) as a HELIO Control.
 *
 * Shows the thruster direction and thrust, with optional setpoints and advice
 * zones for both. Almost every input is a dynamic property so it can be bound
 * to data variables, static values, or other dynamic properties.
 */
export const azimuthThrusterElement = createElement(namespace, {
  name: 'OpenBridge Azimuth Thruster',
  description:
    'Azimuth thruster instrument (OpenBridge design system) showing thruster direction and thrust, with setpoints and advice zones.',
  category: 'OpenBridge',
  icon: { name: 'Fan' },

  traits: [traits.Control],

  propsGroups: {
    thruster: { label: 'Thruster data' },
    angleSetpoint: { label: 'Angle setpoint' },
    thrustSetpoint: { label: 'Thrust setpoint' },
    display: { label: 'Display' },
    angleAdvice: { label: 'Angle advice zones', defaultClosed: true },
    thrustAdvice: { label: 'Thrust advice zones', defaultClosed: true },
    interaction: { label: 'Interaction', defaultClosed: true },
  },

  propsSchema: createPropsSchema().initial({
    angle: props.DynamicProperty({
      label: 'Angle [°]',
      propGroup: 'thruster',
      valueType: 'NumericValue',
      optional: false,
      defaultValue: dynamicProperties.StaticValue(0),
    }),
    thrust: props.DynamicProperty({
      label: 'Thrust [%] (-100 … 100)',
      propGroup: 'thruster',
      valueType: 'NumericValue',
      optional: false,
      defaultValue: dynamicProperties.StaticValue(0),
    }),
    isOff: props.DynamicProperty({
      label: 'Instrument off',
      propGroup: 'thruster',
      valueType: 'Boolean',
      optional: true,
    }),
    isLoading: props.DynamicProperty({
      label: 'Instrument loading',
      propGroup: 'thruster',
      valueType: 'Boolean',
      optional: true,
    }),

    angleSetpoint: props.DynamicProperty({
      label: 'Angle setpoint [°]',
      propGroup: 'angleSetpoint',
      valueType: 'NumericValue',
      optional: true,
    }),
    autoAtAngleSetpoint: props.DynamicProperty({
      label: 'Detect "at setpoint" automatically',
      propGroup: 'angleSetpoint',
      valueType: 'Boolean',
      optional: false,
      defaultValue: dynamicProperties.StaticValue(true),
    }),
    autoAtAngleSetpointDeadband: props.DynamicProperty({
      label: 'At-setpoint deadband [°]',
      propGroup: 'angleSetpoint',
      valueType: 'NumericValue',
      optional: false,
      defaultValue: dynamicProperties.StaticValue(2),
    }),
    atAngleSetpoint: props.DynamicProperty({
      label: 'At setpoint (manual)',
      propGroup: 'angleSetpoint',
      valueType: 'Boolean',
      optional: true,
    }),
    angleSetpointOverride: props.DynamicProperty({
      label: 'Setpoint overridden',
      propGroup: 'angleSetpoint',
      valueType: 'Boolean',
      optional: true,
    }),

    thrustSetpoint: props.DynamicProperty({
      label: 'Thrust setpoint [%]',
      propGroup: 'thrustSetpoint',
      valueType: 'NumericValue',
      optional: true,
    }),
    autoAtThrustSetpoint: props.DynamicProperty({
      label: 'Detect "at setpoint" automatically',
      propGroup: 'thrustSetpoint',
      valueType: 'Boolean',
      optional: false,
      defaultValue: dynamicProperties.StaticValue(true),
    }),
    autoAtThrustSetpointDeadband: props.DynamicProperty({
      label: 'At-setpoint deadband [%]',
      propGroup: 'thrustSetpoint',
      valueType: 'NumericValue',
      optional: false,
      defaultValue: dynamicProperties.StaticValue(1),
    }),
    atThrustSetpoint: props.DynamicProperty({
      label: 'At setpoint (manual)',
      propGroup: 'thrustSetpoint',
      valueType: 'Boolean',
      optional: true,
    }),
    thrustSetpointOverride: props.DynamicProperty({
      label: 'Setpoint overridden',
      propGroup: 'thrustSetpoint',
      valueType: 'Boolean',
      optional: true,
    }),
    animateSetpoint: props.DynamicProperty({
      label: 'Animate setpoint changes',
      propGroup: 'thrustSetpoint',
      valueType: 'Boolean',
      optional: true,
    }),

    enhancedPriority: props.DynamicProperty({
      label: 'Enhanced priority (blue)',
      propGroup: 'display',
      valueType: 'Boolean',
      optional: true,
    }),
    showLabels: props.DynamicProperty({
      label: 'Show angle labels',
      propGroup: 'display',
      valueType: 'Boolean',
      optional: false,
      defaultValue: dynamicProperties.StaticValue(true),
    }),
    tickmarksInside: props.DynamicProperty({
      label: 'Labels inside ring',
      propGroup: 'display',
      valueType: 'Boolean',
      optional: true,
    }),
    tickmarkStyle: props.Enum({
      label: 'Tickmark style',
      propGroup: 'display',
      options: TICKMARK_STYLES,
      optional: false,
      defaultValue: TickmarkStyle.regular,
    }),
    primaryTickmarkInterval: props.Number({
      label: 'Primary tickmarks every [°] (empty = none)',
      propGroup: 'display',
      optional: true,
      defaultValue: 90,
    }),
    secondaryTickmarkInterval: props.Number({
      label: 'Secondary tickmarks every [°]',
      propGroup: 'display',
      optional: true,
    }),
    tertiaryTickmarkInterval: props.Number({
      label: 'Tertiary tickmarks every [°]',
      propGroup: 'display',
      optional: true,
    }),
    topPropeller: props.Enum({
      label: 'Top propeller',
      propGroup: 'display',
      options: PROPELLER_TYPES,
      optional: false,
      defaultValue: PropellerType.none,
    }),
    bottomPropeller: props.Enum({
      label: 'Bottom propeller',
      propGroup: 'display',
      options: PROPELLER_TYPES,
      optional: false,
      defaultValue: PropellerType.none,
    }),
    singleDirection: props.Boolean({
      label: 'Single thrust direction (half-size bar)',
      propGroup: 'display',
      optional: false,
      defaultValue: false,
    }),
    starboardPortIndicator: props.Boolean({
      label: 'Starboard / port indicator',
      propGroup: 'display',
      optional: false,
      defaultValue: false,
    }),

    angleAdviceEnabled: props.DynamicProperty({
      label: 'Advice zone enabled',
      propGroup: 'angleAdvice',
      valueType: 'Boolean',
      optional: true,
    }),
    angleAdviceMin: props.DynamicProperty({
      label: 'Advice zone from [°]',
      propGroup: 'angleAdvice',
      valueType: 'NumericValue',
      optional: true,
    }),
    angleAdviceMax: props.DynamicProperty({
      label: 'Advice zone to [°]',
      propGroup: 'angleAdvice',
      valueType: 'NumericValue',
      optional: true,
    }),
    angleAdviceHinted: props.DynamicProperty({
      label: 'Advice zone hinted',
      propGroup: 'angleAdvice',
      valueType: 'Boolean',
      optional: true,
    }),
    angleCautionEnabled: props.DynamicProperty({
      label: 'Caution zone enabled',
      propGroup: 'angleAdvice',
      valueType: 'Boolean',
      optional: true,
    }),
    angleCautionMin: props.DynamicProperty({
      label: 'Caution zone from [°]',
      propGroup: 'angleAdvice',
      valueType: 'NumericValue',
      optional: true,
    }),
    angleCautionMax: props.DynamicProperty({
      label: 'Caution zone to [°]',
      propGroup: 'angleAdvice',
      valueType: 'NumericValue',
      optional: true,
    }),
    angleCautionHinted: props.DynamicProperty({
      label: 'Caution zone hinted',
      propGroup: 'angleAdvice',
      valueType: 'Boolean',
      optional: true,
    }),

    thrustAdviceEnabled: props.DynamicProperty({
      label: 'Advice zone enabled',
      propGroup: 'thrustAdvice',
      valueType: 'Boolean',
      optional: true,
    }),
    thrustAdviceMin: props.DynamicProperty({
      label: 'Advice zone from [%]',
      propGroup: 'thrustAdvice',
      valueType: 'NumericValue',
      optional: true,
    }),
    thrustAdviceMax: props.DynamicProperty({
      label: 'Advice zone to [%]',
      propGroup: 'thrustAdvice',
      valueType: 'NumericValue',
      optional: true,
    }),
    thrustAdviceHinted: props.DynamicProperty({
      label: 'Advice zone hinted',
      propGroup: 'thrustAdvice',
      valueType: 'Boolean',
      optional: true,
    }),
    thrustCautionEnabled: props.DynamicProperty({
      label: 'Caution zone enabled',
      propGroup: 'thrustAdvice',
      valueType: 'Boolean',
      optional: true,
    }),
    thrustCautionMin: props.DynamicProperty({
      label: 'Caution zone from [%]',
      propGroup: 'thrustAdvice',
      valueType: 'NumericValue',
      optional: true,
    }),
    thrustCautionMax: props.DynamicProperty({
      label: 'Caution zone to [%]',
      propGroup: 'thrustAdvice',
      valueType: 'NumericValue',
      optional: true,
    }),
    thrustCautionHinted: props.DynamicProperty({
      label: 'Caution zone hinted',
      propGroup: 'thrustAdvice',
      valueType: 'Boolean',
      optional: true,
    }),

    onClick: props.Action({
      label: 'On click',
      propGroup: 'interaction',
      optional: true,
    }),
  }),

  Component(p) {
    const renderMode = useRenderMode();

    const num = { valueType: values.Number() };
    const bool = { valueType: values.Boolean() };

    const angle = useDynamicProperty(p.angle, num);
    const thrust = useDynamicProperty(p.thrust, num);
    const isOff = useDynamicProperty(p.isOff, bool);
    const isLoading = useDynamicProperty(p.isLoading, bool);

    const angleSetpoint = useDynamicProperty(p.angleSetpoint, num);
    const autoAtAngleSetpoint = useDynamicProperty(p.autoAtAngleSetpoint, bool);
    const autoAtAngleSetpointDeadband = useDynamicProperty(p.autoAtAngleSetpointDeadband, num);
    const atAngleSetpoint = useDynamicProperty(p.atAngleSetpoint, bool);
    const angleSetpointOverride = useDynamicProperty(p.angleSetpointOverride, bool);

    const thrustSetpoint = useDynamicProperty(p.thrustSetpoint, num);
    const autoAtThrustSetpoint = useDynamicProperty(p.autoAtThrustSetpoint, bool);
    const autoAtThrustSetpointDeadband = useDynamicProperty(p.autoAtThrustSetpointDeadband, num);
    const atThrustSetpoint = useDynamicProperty(p.atThrustSetpoint, bool);
    const thrustSetpointOverride = useDynamicProperty(p.thrustSetpointOverride, bool);
    const animateSetpoint = useDynamicProperty(p.animateSetpoint, bool);

    const enhancedPriority = useDynamicProperty(p.enhancedPriority, bool);
    const showLabels = useDynamicProperty(p.showLabels, bool);
    const tickmarksInside = useDynamicProperty(p.tickmarksInside, bool);

    const angleAdviceEnabled = useDynamicProperty(p.angleAdviceEnabled, bool);
    const angleAdviceMin = useDynamicProperty(p.angleAdviceMin, num);
    const angleAdviceMax = useDynamicProperty(p.angleAdviceMax, num);
    const angleAdviceHinted = useDynamicProperty(p.angleAdviceHinted, bool);
    const angleCautionEnabled = useDynamicProperty(p.angleCautionEnabled, bool);
    const angleCautionMin = useDynamicProperty(p.angleCautionMin, num);
    const angleCautionMax = useDynamicProperty(p.angleCautionMax, num);
    const angleCautionHinted = useDynamicProperty(p.angleCautionHinted, bool);

    const thrustAdviceEnabled = useDynamicProperty(p.thrustAdviceEnabled, bool);
    const thrustAdviceMin = useDynamicProperty(p.thrustAdviceMin, num);
    const thrustAdviceMax = useDynamicProperty(p.thrustAdviceMax, num);
    const thrustAdviceHinted = useDynamicProperty(p.thrustAdviceHinted, bool);
    const thrustCautionEnabled = useDynamicProperty(p.thrustCautionEnabled, bool);
    const thrustCautionMin = useDynamicProperty(p.thrustCautionMin, num);
    const thrustCautionMax = useDynamicProperty(p.thrustCautionMax, num);
    const thrustCautionHinted = useDynamicProperty(p.thrustCautionHinted, bool);

    const onClick = useAction(p.onClick);

    // Dynamic properties need to be mounted to subscribe to value changes.
    const subscriptions = [
      angle,
      thrust,
      isOff,
      isLoading,
      angleSetpoint,
      autoAtAngleSetpoint,
      autoAtAngleSetpointDeadband,
      atAngleSetpoint,
      angleSetpointOverride,
      thrustSetpoint,
      autoAtThrustSetpoint,
      autoAtThrustSetpointDeadband,
      atThrustSetpoint,
      thrustSetpointOverride,
      animateSetpoint,
      enhancedPriority,
      showLabels,
      tickmarksInside,
      angleAdviceEnabled,
      angleAdviceMin,
      angleAdviceMax,
      angleAdviceHinted,
      angleCautionEnabled,
      angleCautionMin,
      angleCautionMax,
      angleCautionHinted,
      thrustAdviceEnabled,
      thrustAdviceMin,
      thrustAdviceMax,
      thrustAdviceHinted,
      thrustCautionEnabled,
      thrustCautionMin,
      thrustCautionMax,
      thrustCautionHinted,
    ];

    const angleRaw = angle.canRead === false ? undefined : toFiniteNumber(angle.value);
    const thrustRaw = thrust.canRead === false ? undefined : toFiniteNumber(thrust.value);
    const angleSetpointValue = optionalNumber(p.angleSetpoint, angleSetpoint);

    const clickable = onClick.canCall === true && renderMode !== 'PreviewEdit';

    return (
      <OpenBridgeTheme>
        {subscriptions.map((dp, index) => (
          <Fragment key={index}>{dp.render()}</Fragment>
        ))}
        {onClick.render()}

        <AzimuthThruster
          state={deriveInstrumentState({
            isOff: optionalBoolean(p.isOff, isOff),
            isLoading: optionalBoolean(p.isLoading, isLoading),
            valueAvailable: angleRaw !== undefined && thrustRaw !== undefined,
          })}
          priority={
            optionalBoolean(p.enhancedPriority, enhancedPriority)
              ? Priority.enhanced
              : Priority.regular
          }
          angle={normalizeAngle(angleRaw ?? 0)}
          thrust={clampThrust(thrustRaw) ?? 0}
          angleSetpoint={
            angleSetpointValue === undefined ? undefined : normalizeAngle(angleSetpointValue)
          }
          atAngleSetpoint={optionalBoolean(p.atAngleSetpoint, atAngleSetpoint) ?? false}
          autoAtAngleSetpoint={toBoolean(autoAtAngleSetpoint.value) ?? true}
          autoAtAngleSetpointDeadband={toFiniteNumber(autoAtAngleSetpointDeadband.value) ?? 2}
          angleSetpointOverride={
            optionalBoolean(p.angleSetpointOverride, angleSetpointOverride) ?? false
          }
          thrustSetpoint={clampThrust(optionalNumber(p.thrustSetpoint, thrustSetpoint))}
          atThrustSetpoint={optionalBoolean(p.atThrustSetpoint, atThrustSetpoint) ?? false}
          autoAtThrustSetpoint={toBoolean(autoAtThrustSetpoint.value) ?? true}
          autoAtThrustSetpointDeadband={toFiniteNumber(autoAtThrustSetpointDeadband.value) ?? 1}
          thrustSetpointOverride={
            optionalBoolean(p.thrustSetpointOverride, thrustSetpointOverride) ?? false
          }
          animateSetpoint={optionalBoolean(p.animateSetpoint, animateSetpoint) ?? false}
          angleAdvices={buildAngleAdvices([
            {
              type: AdviceType.advice,
              enabled: optionalBoolean(p.angleAdviceEnabled, angleAdviceEnabled),
              min: optionalNumber(p.angleAdviceMin, angleAdviceMin),
              max: optionalNumber(p.angleAdviceMax, angleAdviceMax),
              hinted: optionalBoolean(p.angleAdviceHinted, angleAdviceHinted),
            },
            {
              type: AdviceType.caution,
              enabled: optionalBoolean(p.angleCautionEnabled, angleCautionEnabled),
              min: optionalNumber(p.angleCautionMin, angleCautionMin),
              max: optionalNumber(p.angleCautionMax, angleCautionMax),
              hinted: optionalBoolean(p.angleCautionHinted, angleCautionHinted),
            },
          ])}
          thrustAdvices={buildLinearAdvices([
            {
              type: AdviceType.advice,
              enabled: optionalBoolean(p.thrustAdviceEnabled, thrustAdviceEnabled),
              min: clampThrust(optionalNumber(p.thrustAdviceMin, thrustAdviceMin)),
              max: clampThrust(optionalNumber(p.thrustAdviceMax, thrustAdviceMax)),
              hinted: optionalBoolean(p.thrustAdviceHinted, thrustAdviceHinted),
            },
            {
              type: AdviceType.caution,
              enabled: optionalBoolean(p.thrustCautionEnabled, thrustCautionEnabled),
              min: clampThrust(optionalNumber(p.thrustCautionMin, thrustCautionMin)),
              max: clampThrust(optionalNumber(p.thrustCautionMax, thrustCautionMax)),
              hinted: optionalBoolean(p.thrustCautionHinted, thrustCautionHinted),
            },
          ])}
          showLabels={toBoolean(showLabels.value) ?? true}
          tickmarksInside={optionalBoolean(p.tickmarksInside, tickmarksInside) ?? false}
          tickmarkStyle={p.tickmarkStyle as TickmarkStyle}
          primaryTickmarkInterval={p.primaryTickmarkInterval}
          secondaryTickmarkInterval={p.secondaryTickmarkInterval}
          tertiaryTickmarkInterval={p.tertiaryTickmarkInterval}
          topPropeller={p.topPropeller as PropellerType}
          bottomPropeller={p.bottomPropeller as PropellerType}
          singleDirection={p.singleDirection}
          starboardPortIndicator={p.starboardPortIndicator}
          onClick={clickable ? onClick.call : undefined}
        />
      </OpenBridgeTheme>
    );
  },
});
