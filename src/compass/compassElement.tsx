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
import { namespace } from '../namespace';
import {
  CENTER_DISPLAY_OPTIONS,
  buildAdvices,
  buildCenterReadouts,
  deriveInstrumentState,
  normalizeAngle,
  parseDirection,
  parsePriorityElements,
  parseTheme,
  toBoolean,
  toFiniteNumber,
  type CenterDisplay,
} from './compassMapping';
import {
  CogArrowStyle,
  CompassDirection,
  CompassView,
  HdgArrowStyle,
  Priority,
  RotPosition,
  RotType,
  VesselImage,
} from './CompassView';

// Only top-down vessel silhouettes make sense in the middle of a compass.
const TOP_VESSEL_IMAGES = Object.values(VesselImage).filter((image) =>
  image.endsWith('-top'),
) as [VesselImage, ...VesselImage[]];

const HDG_ARROW_STYLES = Object.values(HdgArrowStyle) as [HdgArrowStyle, ...HdgArrowStyle[]];
const COG_ARROW_STYLES = Object.values(CogArrowStyle) as [CogArrowStyle, ...CogArrowStyle[]];
const ROT_TYPES = Object.values(RotType) as [RotType, ...RotType[]];
const ROT_POSITIONS = Object.values(RotPosition) as [RotPosition, ...RotPosition[]];

/**
 * OpenBridge compass (`<obc-compass>`) as a HELIO Control.
 *
 * Almost every input is a dynamic property so it can be bound to data
 * variables, static values, or other dynamic properties (e.g. the "Angle
 * Conversion" property from this extension) and change at runtime.
 */
export const compassElement = createElement(namespace, {
  name: 'OpenBridge Compass',
  description:
    'Maritime compass instrument (OpenBridge design system) showing heading, course over ground, rate of turn, setpoint, advice zones, wind and current.',
  category: 'OpenBridge',
  icon: { name: 'Compass' },

  traits: [traits.Control],

  propsGroups: {
    navigation: { label: 'Navigation data' },
    setpoint: { label: 'Heading setpoint' },
    display: { label: 'Display' },
    advice: { label: 'Advice zones', defaultClosed: true },
    environment: { label: 'Wind & current', defaultClosed: true },
    rateOfTurn: { label: 'Rate of turn', defaultClosed: true },
    interaction: { label: 'Interaction', defaultClosed: true },
  },

  propsSchema: createPropsSchema().initial({
    // ── Navigation data ────────────────────────────────────────────────
    heading: props.DynamicProperty({
      label: 'Heading (HDG) [°]',
      propGroup: 'navigation',
      valueType: 'NumericValue',
      optional: false,
      defaultValue: dynamicProperties.StaticValue(0),
    }),
    courseOverGround: props.DynamicProperty({
      label: 'Course over ground (COG) [°]',
      propGroup: 'navigation',
      valueType: 'NumericValue',
      optional: true,
    }),
    rateOfTurn: props.DynamicProperty({
      label: 'Rate of turn (ROT) [°/min]',
      propGroup: 'navigation',
      valueType: 'NumericValue',
      optional: true,
    }),
    angleOffset: props.DynamicProperty({
      label: 'Angle offset / variation [°]',
      propGroup: 'navigation',
      valueType: 'NumericValue',
      optional: true,
    }),
    isOff: props.DynamicProperty({
      label: 'Instrument off',
      propGroup: 'navigation',
      valueType: 'Boolean',
      optional: true,
    }),
    isLoading: props.DynamicProperty({
      label: 'Instrument loading',
      propGroup: 'navigation',
      valueType: 'Boolean',
      optional: true,
    }),

    // ── Heading setpoint ───────────────────────────────────────────────
    headingSetpoint: props.DynamicProperty({
      label: 'Heading setpoint [°]',
      propGroup: 'setpoint',
      valueType: 'NumericValue',
      optional: true,
    }),
    autoAtHeadingSetpoint: props.DynamicProperty({
      label: 'Detect "at setpoint" automatically',
      propGroup: 'setpoint',
      valueType: 'Boolean',
      optional: false,
      defaultValue: dynamicProperties.StaticValue(true),
    }),
    autoAtHeadingSetpointDeadband: props.DynamicProperty({
      label: 'At-setpoint deadband [°]',
      propGroup: 'setpoint',
      valueType: 'NumericValue',
      optional: false,
      defaultValue: dynamicProperties.StaticValue(2),
    }),
    atHeadingSetpoint: props.DynamicProperty({
      label: 'At setpoint (manual)',
      propGroup: 'setpoint',
      valueType: 'Boolean',
      optional: true,
    }),
    headingSetpointOverride: props.DynamicProperty({
      label: 'Setpoint overridden',
      propGroup: 'setpoint',
      valueType: 'Boolean',
      optional: true,
    }),
    animateSetpoint: props.DynamicProperty({
      label: 'Animate setpoint changes',
      propGroup: 'setpoint',
      valueType: 'Boolean',
      optional: true,
    }),

    // ── Display ────────────────────────────────────────────────────────
    theme: props.DynamicProperty({
      label: 'Palette (bright | day | dusk | night)',
      propGroup: 'display',
      valueType: 'PrimitiveValue',
      optional: false,
      defaultValue: dynamicProperties.StaticValue('day'),
    }),
    direction: props.DynamicProperty({
      label: 'Orientation (northUp | headingUp | courseUp)',
      propGroup: 'display',
      valueType: 'PrimitiveValue',
      optional: false,
      defaultValue: dynamicProperties.StaticValue('northUp'),
    }),
    showLabels: props.DynamicProperty({
      label: 'Show N/E/S/W labels',
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
    enhancedPriority: props.DynamicProperty({
      label: 'Enhanced priority (blue)',
      propGroup: 'display',
      valueType: 'Boolean',
      optional: true,
    }),
    priorityElements: props.DynamicProperty({
      label: 'Enhanced elements (hdg, cog, rot, wind, current)',
      propGroup: 'display',
      valueType: 'String',
      optional: true,
    }),
    centerDisplay: props.Enum({
      label: 'Center display',
      propGroup: 'display',
      options: [...CENTER_DISPLAY_OPTIONS],
      optional: false,
      defaultValue: 'Vessel image',
    }),
    readoutFractionDigits: props.Number({
      label: 'Readout decimals',
      propGroup: 'display',
      optional: true,
    }),
    vesselImage: props.Enum({
      label: 'Vessel image',
      propGroup: 'display',
      options: TOP_VESSEL_IMAGES,
      optional: false,
      defaultValue: VesselImage.genericTop,
    }),
    hdgArrowStyle: props.Enum({
      label: 'HDG arrow style',
      propGroup: 'display',
      options: HDG_ARROW_STYLES,
      optional: false,
      defaultValue: HdgArrowStyle.arrowHead,
    }),
    cogArrowStyle: props.Enum({
      label: 'COG arrow style',
      propGroup: 'display',
      options: COG_ARROW_STYLES,
      optional: false,
      defaultValue: CogArrowStyle.arrowHead,
    }),
    faceDiameter: props.Number({
      label: 'Fixed diameter [px] (empty = fill)',
      propGroup: 'display',
      optional: true,
    }),

    // ── Advice zones ───────────────────────────────────────────────────
    adviceEnabled: props.DynamicProperty({
      label: 'Advice zone enabled',
      propGroup: 'advice',
      valueType: 'Boolean',
      optional: true,
    }),
    adviceMin: props.DynamicProperty({
      label: 'Advice zone from [°]',
      propGroup: 'advice',
      valueType: 'NumericValue',
      optional: true,
    }),
    adviceMax: props.DynamicProperty({
      label: 'Advice zone to [°]',
      propGroup: 'advice',
      valueType: 'NumericValue',
      optional: true,
    }),
    adviceHinted: props.DynamicProperty({
      label: 'Advice zone hinted',
      propGroup: 'advice',
      valueType: 'Boolean',
      optional: true,
    }),
    cautionEnabled: props.DynamicProperty({
      label: 'Caution zone enabled',
      propGroup: 'advice',
      valueType: 'Boolean',
      optional: true,
    }),
    cautionMin: props.DynamicProperty({
      label: 'Caution zone from [°]',
      propGroup: 'advice',
      valueType: 'NumericValue',
      optional: true,
    }),
    cautionMax: props.DynamicProperty({
      label: 'Caution zone to [°]',
      propGroup: 'advice',
      valueType: 'NumericValue',
      optional: true,
    }),
    cautionHinted: props.DynamicProperty({
      label: 'Caution zone hinted',
      propGroup: 'advice',
      valueType: 'Boolean',
      optional: true,
    }),

    // ── Wind & current ─────────────────────────────────────────────────
    windSpeed: props.DynamicProperty({
      label: 'Wind speed [kn]',
      propGroup: 'environment',
      valueType: 'NumericValue',
      optional: true,
    }),
    windFromDirection: props.DynamicProperty({
      label: 'Wind from direction [°]',
      propGroup: 'environment',
      valueType: 'NumericValue',
      optional: true,
    }),
    currentSpeed: props.DynamicProperty({
      label: 'Current speed [arrows]',
      propGroup: 'environment',
      valueType: 'NumericValue',
      optional: true,
    }),
    currentFromDirection: props.DynamicProperty({
      label: 'Current from direction [°]',
      propGroup: 'environment',
      valueType: 'NumericValue',
      optional: true,
    }),

    // ── Rate of turn ───────────────────────────────────────────────────
    rotType: props.Enum({
      label: 'ROT indicator',
      propGroup: 'rateOfTurn',
      options: ROT_TYPES,
      optional: false,
      defaultValue: RotType.dots,
    }),
    rotPosition: props.Enum({
      label: 'ROT position',
      propGroup: 'rateOfTurn',
      options: ROT_POSITIONS,
      optional: false,
      defaultValue: RotPosition.innerCircle,
    }),
    rotMaxValue: props.DynamicProperty({
      label: 'ROT full-scale (bar) [°/min]',
      propGroup: 'rateOfTurn',
      valueType: 'NumericValue',
      optional: false,
      defaultValue: dynamicProperties.StaticValue(60),
    }),
    rotDotAnimationFactor: props.Number({
      label: 'ROT dot animation gain',
      propGroup: 'rateOfTurn',
      optional: false,
      defaultValue: 18,
    }),

    // ── Interaction ────────────────────────────────────────────────────
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

    // Navigation data
    const heading = useDynamicProperty(p.heading, num);
    const courseOverGround = useDynamicProperty(p.courseOverGround, num);
    const rateOfTurn = useDynamicProperty(p.rateOfTurn, num);
    const angleOffset = useDynamicProperty(p.angleOffset, num);
    const isOff = useDynamicProperty(p.isOff, bool);
    const isLoading = useDynamicProperty(p.isLoading, bool);

    // Setpoint
    const headingSetpoint = useDynamicProperty(p.headingSetpoint, num);
    const autoAtHeadingSetpoint = useDynamicProperty(p.autoAtHeadingSetpoint, bool);
    const autoAtHeadingSetpointDeadband = useDynamicProperty(p.autoAtHeadingSetpointDeadband, num);
    const atHeadingSetpoint = useDynamicProperty(p.atHeadingSetpoint, bool);
    const headingSetpointOverride = useDynamicProperty(p.headingSetpointOverride, bool);
    const animateSetpoint = useDynamicProperty(p.animateSetpoint, bool);

    // Display (theme & direction accept strings or indices, so no value type filter)
    const theme = useDynamicProperty(p.theme);
    const direction = useDynamicProperty(p.direction);
    const showLabels = useDynamicProperty(p.showLabels, bool);
    const tickmarksInside = useDynamicProperty(p.tickmarksInside, bool);
    const enhancedPriority = useDynamicProperty(p.enhancedPriority, bool);
    const priorityElements = useDynamicProperty(p.priorityElements, {
      valueType: values.String(),
    });

    // Advice zones
    const adviceEnabled = useDynamicProperty(p.adviceEnabled, bool);
    const adviceMin = useDynamicProperty(p.adviceMin, num);
    const adviceMax = useDynamicProperty(p.adviceMax, num);
    const adviceHinted = useDynamicProperty(p.adviceHinted, bool);
    const cautionEnabled = useDynamicProperty(p.cautionEnabled, bool);
    const cautionMin = useDynamicProperty(p.cautionMin, num);
    const cautionMax = useDynamicProperty(p.cautionMax, num);
    const cautionHinted = useDynamicProperty(p.cautionHinted, bool);

    // Wind & current
    const windSpeed = useDynamicProperty(p.windSpeed, num);
    const windFromDirection = useDynamicProperty(p.windFromDirection, num);
    const currentSpeed = useDynamicProperty(p.currentSpeed, num);
    const currentFromDirection = useDynamicProperty(p.currentFromDirection, num);

    // Rate of turn
    const rotMaxValue = useDynamicProperty(p.rotMaxValue, num);

    const onClick = useAction(p.onClick);

    // Dynamic properties need to be mounted to subscribe to value changes.
    const subscriptions = [
      heading,
      courseOverGround,
      rateOfTurn,
      angleOffset,
      isOff,
      isLoading,
      headingSetpoint,
      autoAtHeadingSetpoint,
      autoAtHeadingSetpointDeadband,
      atHeadingSetpoint,
      headingSetpointOverride,
      animateSetpoint,
      theme,
      direction,
      showLabels,
      tickmarksInside,
      enhancedPriority,
      priorityElements,
      adviceEnabled,
      adviceMin,
      adviceMax,
      adviceHinted,
      cautionEnabled,
      cautionMin,
      cautionMax,
      cautionHinted,
      windSpeed,
      windFromDirection,
      currentSpeed,
      currentFromDirection,
      rotMaxValue,
    ];

    // Optional props that are not configured must not contribute values.
    const optionalNumber = (
      ref: unknown,
      dp: { value: unknown; canRead: boolean | undefined },
    ): number | undefined =>
      ref === undefined || dp.canRead === false ? undefined : toFiniteNumber(dp.value);
    const optionalBoolean = (
      ref: unknown,
      dp: { value: unknown; canRead: boolean | undefined },
    ): boolean | undefined =>
      ref === undefined || dp.canRead === false ? undefined : toBoolean(dp.value);

    const offset = optionalNumber(p.angleOffset, angleOffset) ?? 0;
    const withOffset = (angle: number | undefined) =>
      angle === undefined ? undefined : normalizeAngle(angle + offset);

    const headingRaw = heading.canRead === false ? undefined : toFiniteNumber(heading.value);
    const headingValue = withOffset(headingRaw) ?? 0;

    const enhancedElements =
      p.priorityElements === undefined ? [] : parsePriorityElements(priorityElements.value);

    const clickable = onClick.canCall === true && renderMode !== 'PreviewEdit';

    return (
      <Fragment>
        {subscriptions.map((dp, index) => (
          <Fragment key={index}>{dp.render()}</Fragment>
        ))}
        {onClick.render()}

        <CompassView
          theme={parseTheme(theme.value) ?? 'day'}
          state={deriveInstrumentState({
            isOff: optionalBoolean(p.isOff, isOff),
            isLoading: optionalBoolean(p.isLoading, isLoading),
            headingAvailable: headingRaw !== undefined,
          })}
          direction={parseDirection(direction.value) ?? CompassDirection.NorthUp}
          heading={headingValue}
          courseOverGround={withOffset(optionalNumber(p.courseOverGround, courseOverGround))}
          rateOfTurnDegreesPerMinute={optionalNumber(p.rateOfTurn, rateOfTurn)}
          headingSetpoint={withOffset(optionalNumber(p.headingSetpoint, headingSetpoint))}
          atHeadingSetpoint={optionalBoolean(p.atHeadingSetpoint, atHeadingSetpoint) ?? false}
          autoAtHeadingSetpoint={toBoolean(autoAtHeadingSetpoint.value) ?? true}
          autoAtHeadingSetpointDeadband={toFiniteNumber(autoAtHeadingSetpointDeadband.value) ?? 2}
          headingSetpointOverride={
            optionalBoolean(p.headingSetpointOverride, headingSetpointOverride) ?? false
          }
          animateSetpoint={optionalBoolean(p.animateSetpoint, animateSetpoint) ?? false}
          headingAdvices={buildAdvices([
            {
              type: AdviceType.advice,
              enabled: optionalBoolean(p.adviceEnabled, adviceEnabled),
              min: withOffset(optionalNumber(p.adviceMin, adviceMin)),
              max: withOffset(optionalNumber(p.adviceMax, adviceMax)),
              hinted: optionalBoolean(p.adviceHinted, adviceHinted),
            },
            {
              type: AdviceType.caution,
              enabled: optionalBoolean(p.cautionEnabled, cautionEnabled),
              min: withOffset(optionalNumber(p.cautionMin, cautionMin)),
              max: withOffset(optionalNumber(p.cautionMax, cautionMax)),
              hinted: optionalBoolean(p.cautionHinted, cautionHinted),
            },
          ])}
          windSpeedKnots={optionalNumber(p.windSpeed, windSpeed)}
          windFromDirection={withOffset(optionalNumber(p.windFromDirection, windFromDirection))}
          currentSpeed={optionalNumber(p.currentSpeed, currentSpeed)}
          currentFromDirection={withOffset(
            optionalNumber(p.currentFromDirection, currentFromDirection),
          )}
          priority={
            optionalBoolean(p.enhancedPriority, enhancedPriority)
              ? Priority.enhanced
              : Priority.regular
          }
          priorityElements={
            enhancedElements.length > 0 ? enhancedElements : parsePriorityElements('hdg')
          }
          showLabels={toBoolean(showLabels.value) ?? true}
          tickmarksInside={optionalBoolean(p.tickmarksInside, tickmarksInside) ?? false}
          hdgArrowStyle={p.hdgArrowStyle as HdgArrowStyle}
          cogArrowStyle={p.cogArrowStyle as CogArrowStyle}
          vesselImage={p.vesselImage as VesselImage}
          centerReadouts={buildCenterReadouts(
            p.centerDisplay as CenterDisplay,
            p.readoutFractionDigits,
          )}
          rotType={p.rotType as RotType}
          rotPosition={p.rotPosition as RotPosition}
          rotMaxValue={toFiniteNumber(rotMaxValue.value) ?? 60}
          rotDotAnimationFactor={p.rotDotAnimationFactor}
          faceDiameter={p.faceDiameter}
          onClick={clickable ? onClick.call : undefined}
        />
      </Fragment>
    );
  },
});
