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
import { namespace } from '../../namespace';
import { BarHorizontal, type BarHorizontalProps } from '../../components/BarsGraphs/BarHorizontal';
import {
  buildLinearAdvices,
  deriveInstrumentState,
  optionalBoolean,
  optionalNumber,
  optionalNumberList,
  toFiniteNumber,
} from '../../utils/valueMapping';

export const barHorizontalElement = createElement(namespace, {
  name: 'OpenBridge Bar Horizontal',
  description: 'Horizontal SVG bar + external scale (OpenBridge design system).',
  category: 'OpenBridge Bars and Graphs',
  icon: { name: 'Dashboard' },

  traits: [traits.Control],

  propsGroups: {
    data: { label: 'Values' },
    setpoint: { label: 'Setpoint' },
    display: { label: 'Display' },
    scale: { label: 'Scale', defaultClosed: true },
    fill: { label: 'Fill', defaultClosed: true },
    advicesZones: { label: 'Advice zones', defaultClosed: true },
    interaction: { label: 'Interaction', defaultClosed: true },
  },

  propsSchema: createPropsSchema().initial({
    isOff: props.DynamicProperty({
      label: 'Instrument off',
      propGroup: 'data',
      valueType: 'Boolean',
      optional: true,
    }),
    isLoading: props.DynamicProperty({
      label: 'Instrument loading',
      propGroup: 'data',
      valueType: 'Boolean',
      optional: true,
    }),
    minValue: props.DynamicProperty({
      label: 'Min value (default 0)',
      propGroup: 'display',
      valueType: 'NumericValue',
      optional: true,
    }),
    maxValue: props.DynamicProperty({
      label: 'Max value (default 100)',
      propGroup: 'display',
      valueType: 'NumericValue',
      optional: true,
    }),
    reverse: props.DynamicProperty({
      label: 'Reverse (default false)',
      propGroup: 'display',
      valueType: 'Boolean',
      optional: true,
    }),
    paddingLeft: props.DynamicProperty({
      label: 'Padding left',
      propGroup: 'display',
      valueType: 'NumericValue',
      optional: true,
    }),
    paddingRight: props.DynamicProperty({
      label: 'Padding right',
      propGroup: 'display',
      valueType: 'NumericValue',
      optional: true,
    }),
    side: props.Enum({
      label: 'Side',
      propGroup: 'display',
      options: ['left', 'right', 'top', 'bottom'],
      optional: true,
    }),
    fixedAspectRatio: props.DynamicProperty({
      label: 'Fixed aspect ratio (default false)',
      propGroup: 'display',
      valueType: 'Boolean',
      optional: true,
    }),
    scaleReferenceSize: props.DynamicProperty({
      label: 'Scale reference size (default 384)',
      propGroup: 'scale',
      valueType: 'NumericValue',
      optional: true,
    }),
    hasScale: props.DynamicProperty({
      label: 'Has scale (default true)',
      propGroup: 'display',
      valueType: 'Boolean',
      optional: true,
    }),
    showLabels: props.DynamicProperty({
      label: 'Show labels (default true)',
      propGroup: 'display',
      valueType: 'Boolean',
      optional: true,
    }),
    showMainTickmarkLabels: props.DynamicProperty({
      label: 'Show main tickmark labels (default false)',
      propGroup: 'display',
      valueType: 'Boolean',
      optional: true,
    }),
    hasBar: props.DynamicProperty({
      label: 'Has bar (default false)',
      propGroup: 'display',
      valueType: 'Boolean',
      optional: true,
    }),
    scaleBackground: props.DynamicProperty({
      label: 'Scale background (default false)',
      propGroup: 'scale',
      valueType: 'Boolean',
      optional: true,
    }),
    barContainerStyle: props.Enum({
      label: 'Bar container style',
      propGroup: 'display',
      options: ['primary', 'secondary'],
      optional: true,
    }),
    barThickness: props.DynamicProperty({
      label: 'Bar thickness (default 24)',
      propGroup: 'display',
      valueType: 'NumericValue',
      optional: true,
    }),
    tickThickness: props.DynamicProperty({
      label: 'Tick thickness (default 24)',
      propGroup: 'display',
      valueType: 'NumericValue',
      optional: true,
    }),
    labelThickness: props.DynamicProperty({
      label: 'Label thickness (default 60)',
      propGroup: 'display',
      valueType: 'NumericValue',
      optional: true,
    }),
    mainTickmarks: props.DynamicProperty({
      label: 'Main tickmarks (list of numbers)',
      propGroup: 'display',
      valueType: 'String',
      optional: true,
    }),
    primaryTickmarkInterval: props.DynamicProperty({
      label: 'Primary tickmark interval',
      propGroup: 'display',
      valueType: 'NumericValue',
      optional: true,
    }),
    secondaryTickmarkInterval: props.DynamicProperty({
      label: 'Secondary tickmark interval',
      propGroup: 'display',
      valueType: 'NumericValue',
      optional: true,
    }),
    tertiaryTickmarkInterval: props.DynamicProperty({
      label: 'Tertiary tickmark interval',
      propGroup: 'display',
      valueType: 'NumericValue',
      optional: true,
    }),
    scaleType: props.Enum({
      label: 'Scale type',
      propGroup: 'scale',
      options: ['regular', 'condensed'],
      optional: true,
    }),
    frameStyle: props.Enum({
      label: 'Frame style',
      propGroup: 'display',
      options: ['regular', 'flat', 'framed', 'instrument'],
      optional: true,
    }),
    borderRadiusPosition: props.Enum({
      label: 'Border radius position',
      propGroup: 'display',
      options: ['innerFirstChild', 'middleChild', 'middleRoundedChild', 'outerLastChild'],
      optional: true,
    }),
    instrumentMode: props.DynamicProperty({
      label: 'Instrument mode (default false)',
      propGroup: 'display',
      valueType: 'Boolean',
      optional: true,
    }),
    borderRadius: props.DynamicProperty({
      label: 'Border radius',
      propGroup: 'display',
      valueType: 'NumericValue',
      optional: true,
    }),
    enhancedPriority: props.DynamicProperty({
      label: 'Enhanced priority (blue)',
      propGroup: 'display',
      valueType: 'Boolean',
      optional: true,
    }),
    fillMode: props.Enum({
      label: 'Fill mode',
      propGroup: 'fill',
      options: ['fill', 'tint'],
      optional: true,
    }),
    fillMin: props.DynamicProperty({
      label: 'Fill min',
      propGroup: 'fill',
      valueType: 'NumericValue',
      optional: true,
    }),
    fillMax: props.DynamicProperty({
      label: 'Fill max',
      propGroup: 'fill',
      valueType: 'NumericValue',
      optional: true,
    }),
    value: props.DynamicProperty({
      label: 'Value',
      propGroup: 'data',
      valueType: 'NumericValue',
      optional: false,
      defaultValue: dynamicProperties.StaticValue(0),
    }),
    advicePosition: props.Enum({
      label: 'Advice position',
      propGroup: 'display',
      options: ['center', 'inner', 'outer'],
      optional: true,
    }),
    adviceEnabled: props.DynamicProperty({
      label: 'Advice zone enabled',
      propGroup: 'advicesZones',
      valueType: 'Boolean',
      optional: true,
    }),
    adviceMin: props.DynamicProperty({
      label: 'Advice zone from',
      propGroup: 'advicesZones',
      valueType: 'NumericValue',
      optional: true,
    }),
    adviceMax: props.DynamicProperty({
      label: 'Advice zone to',
      propGroup: 'advicesZones',
      valueType: 'NumericValue',
      optional: true,
    }),
    adviceHinted: props.DynamicProperty({
      label: 'Advice zone hinted',
      propGroup: 'advicesZones',
      valueType: 'Boolean',
      optional: true,
    }),
    cautionEnabled: props.DynamicProperty({
      label: 'Caution zone enabled',
      propGroup: 'advicesZones',
      valueType: 'Boolean',
      optional: true,
    }),
    cautionMin: props.DynamicProperty({
      label: 'Caution zone from',
      propGroup: 'advicesZones',
      valueType: 'NumericValue',
      optional: true,
    }),
    cautionMax: props.DynamicProperty({
      label: 'Caution zone to',
      propGroup: 'advicesZones',
      valueType: 'NumericValue',
      optional: true,
    }),
    cautionHinted: props.DynamicProperty({
      label: 'Caution zone hinted',
      propGroup: 'advicesZones',
      valueType: 'Boolean',
      optional: true,
    }),
    highlightCurrentValue: props.DynamicProperty({
      label: 'Highlight current value (default false)',
      propGroup: 'display',
      valueType: 'Boolean',
      optional: true,
    }),
    setpoint: props.DynamicProperty({
      label: 'Setpoint',
      propGroup: 'setpoint',
      valueType: 'NumericValue',
      optional: true,
    }),
    atSetpoint: props.DynamicProperty({
      label: 'At setpoint (default false)',
      propGroup: 'setpoint',
      valueType: 'Boolean',
      optional: true,
    }),
    autoAtSetpoint: props.DynamicProperty({
      label: 'Auto at setpoint (default true)',
      propGroup: 'setpoint',
      valueType: 'Boolean',
      optional: true,
    }),
    autoAtSetpointDeadband: props.DynamicProperty({
      label: 'Auto at setpoint deadband',
      propGroup: 'setpoint',
      valueType: 'NumericValue',
      optional: true,
    }),
    setpointAtZeroDeadband: props.DynamicProperty({
      label: 'Setpoint at zero deadband',
      propGroup: 'setpoint',
      valueType: 'NumericValue',
      optional: true,
    }),
    setpointOverride: props.DynamicProperty({
      label: 'Setpoint override (default false)',
      propGroup: 'setpoint',
      valueType: 'Boolean',
      optional: true,
    }),
    animateSetpoint: props.DynamicProperty({
      label: 'Animate setpoint (default false)',
      propGroup: 'setpoint',
      valueType: 'Boolean',
      optional: true,
    }),
    onClick: props.Action({
      label: 'On click',
      propGroup: 'interaction',
      optional: true,
    }),
    onScaleDimensionsChanged: props.Action({
      label: 'On scale dimensions changed',
      propGroup: 'interaction',
      optional: true,
    }),
  }),

  Component(p) {
    const renderMode = useRenderMode();
    const interactive = renderMode !== 'PreviewEdit';

    const isOffDp = useDynamicProperty(p.isOff, { valueType: values.Boolean() });
    const isLoadingDp = useDynamicProperty(p.isLoading, { valueType: values.Boolean() });
    const minValueDp = useDynamicProperty(p.minValue, { valueType: values.Number() });
    const maxValueDp = useDynamicProperty(p.maxValue, { valueType: values.Number() });
    const reverseDp = useDynamicProperty(p.reverse, { valueType: values.Boolean() });
    const paddingLeftDp = useDynamicProperty(p.paddingLeft, { valueType: values.Number() });
    const paddingRightDp = useDynamicProperty(p.paddingRight, { valueType: values.Number() });
    const fixedAspectRatioDp = useDynamicProperty(p.fixedAspectRatio, {
      valueType: values.Boolean(),
    });
    const scaleReferenceSizeDp = useDynamicProperty(p.scaleReferenceSize, {
      valueType: values.Number(),
    });
    const hasScaleDp = useDynamicProperty(p.hasScale, { valueType: values.Boolean() });
    const showLabelsDp = useDynamicProperty(p.showLabels, { valueType: values.Boolean() });
    const showMainTickmarkLabelsDp = useDynamicProperty(p.showMainTickmarkLabels, {
      valueType: values.Boolean(),
    });
    const hasBarDp = useDynamicProperty(p.hasBar, { valueType: values.Boolean() });
    const scaleBackgroundDp = useDynamicProperty(p.scaleBackground, {
      valueType: values.Boolean(),
    });
    const barThicknessDp = useDynamicProperty(p.barThickness, { valueType: values.Number() });
    const tickThicknessDp = useDynamicProperty(p.tickThickness, { valueType: values.Number() });
    const labelThicknessDp = useDynamicProperty(p.labelThickness, { valueType: values.Number() });
    const mainTickmarksDp = useDynamicProperty(p.mainTickmarks, { valueType: values.String() });
    const primaryTickmarkIntervalDp = useDynamicProperty(p.primaryTickmarkInterval, {
      valueType: values.Number(),
    });
    const secondaryTickmarkIntervalDp = useDynamicProperty(p.secondaryTickmarkInterval, {
      valueType: values.Number(),
    });
    const tertiaryTickmarkIntervalDp = useDynamicProperty(p.tertiaryTickmarkInterval, {
      valueType: values.Number(),
    });
    const instrumentModeDp = useDynamicProperty(p.instrumentMode, { valueType: values.Boolean() });
    const borderRadiusDp = useDynamicProperty(p.borderRadius, { valueType: values.Number() });
    const enhancedPriorityDp = useDynamicProperty(p.enhancedPriority, {
      valueType: values.Boolean(),
    });
    const fillMinDp = useDynamicProperty(p.fillMin, { valueType: values.Number() });
    const fillMaxDp = useDynamicProperty(p.fillMax, { valueType: values.Number() });
    const valueDp = useDynamicProperty(p.value, { valueType: values.Number() });
    const adviceEnabledDp = useDynamicProperty(p.adviceEnabled, { valueType: values.Boolean() });
    const adviceMinDp = useDynamicProperty(p.adviceMin, { valueType: values.Number() });
    const adviceMaxDp = useDynamicProperty(p.adviceMax, { valueType: values.Number() });
    const adviceHintedDp = useDynamicProperty(p.adviceHinted, { valueType: values.Boolean() });
    const cautionEnabledDp = useDynamicProperty(p.cautionEnabled, { valueType: values.Boolean() });
    const cautionMinDp = useDynamicProperty(p.cautionMin, { valueType: values.Number() });
    const cautionMaxDp = useDynamicProperty(p.cautionMax, { valueType: values.Number() });
    const cautionHintedDp = useDynamicProperty(p.cautionHinted, { valueType: values.Boolean() });
    const highlightCurrentValueDp = useDynamicProperty(p.highlightCurrentValue, {
      valueType: values.Boolean(),
    });
    const setpointDp = useDynamicProperty(p.setpoint, { valueType: values.Number() });
    const atSetpointDp = useDynamicProperty(p.atSetpoint, { valueType: values.Boolean() });
    const autoAtSetpointDp = useDynamicProperty(p.autoAtSetpoint, { valueType: values.Boolean() });
    const autoAtSetpointDeadbandDp = useDynamicProperty(p.autoAtSetpointDeadband, {
      valueType: values.Number(),
    });
    const setpointAtZeroDeadbandDp = useDynamicProperty(p.setpointAtZeroDeadband, {
      valueType: values.Number(),
    });
    const setpointOverrideDp = useDynamicProperty(p.setpointOverride, {
      valueType: values.Boolean(),
    });
    const animateSetpointDp = useDynamicProperty(p.animateSetpoint, {
      valueType: values.Boolean(),
    });

    const onClick = useAction(p.onClick);
    const onScaleDimensionsChangedAction = useAction(p.onScaleDimensionsChanged);

    // Dynamic properties need to be mounted to subscribe to value changes.
    const subscriptions = [
      isOffDp,
      isLoadingDp,
      minValueDp,
      maxValueDp,
      reverseDp,
      paddingLeftDp,
      paddingRightDp,
      fixedAspectRatioDp,
      scaleReferenceSizeDp,
      hasScaleDp,
      showLabelsDp,
      showMainTickmarkLabelsDp,
      hasBarDp,
      scaleBackgroundDp,
      barThicknessDp,
      tickThicknessDp,
      labelThicknessDp,
      mainTickmarksDp,
      primaryTickmarkIntervalDp,
      secondaryTickmarkIntervalDp,
      tertiaryTickmarkIntervalDp,
      instrumentModeDp,
      borderRadiusDp,
      enhancedPriorityDp,
      fillMinDp,
      fillMaxDp,
      valueDp,
      adviceEnabledDp,
      adviceMinDp,
      adviceMaxDp,
      adviceHintedDp,
      cautionEnabledDp,
      cautionMinDp,
      cautionMaxDp,
      cautionHintedDp,
      highlightCurrentValueDp,
      setpointDp,
      atSetpointDp,
      autoAtSetpointDp,
      autoAtSetpointDeadbandDp,
      setpointAtZeroDeadbandDp,
      setpointOverrideDp,
      animateSetpointDp,
    ];

    const valueRaw = valueDp.canRead === false ? undefined : toFiniteNumber(valueDp.value);

    const clickable = onClick.canCall === true && interactive;

    return (
      <Fragment>
        {subscriptions.map((dp, index) => (
          <Fragment key={index}>{dp.render()}</Fragment>
        ))}
        {onClick.render()}
        {onScaleDimensionsChangedAction.render()}

        <BarHorizontal
          minValue={optionalNumber(p.minValue, minValueDp) ?? 0}
          maxValue={optionalNumber(p.maxValue, maxValueDp) ?? 100}
          reverse={optionalBoolean(p.reverse, reverseDp) ?? false}
          paddingLeft={optionalNumber(p.paddingLeft, paddingLeftDp)}
          paddingRight={optionalNumber(p.paddingRight, paddingRightDp)}
          side={p.side as BarHorizontalProps['side']}
          fixedAspectRatio={optionalBoolean(p.fixedAspectRatio, fixedAspectRatioDp) ?? false}
          scaleReferenceSize={optionalNumber(p.scaleReferenceSize, scaleReferenceSizeDp) ?? 384}
          hasScale={optionalBoolean(p.hasScale, hasScaleDp) ?? true}
          showLabels={optionalBoolean(p.showLabels, showLabelsDp) ?? true}
          showMainTickmarkLabels={
            optionalBoolean(p.showMainTickmarkLabels, showMainTickmarkLabelsDp) ?? false
          }
          hasBar={optionalBoolean(p.hasBar, hasBarDp) ?? false}
          scaleBackground={optionalBoolean(p.scaleBackground, scaleBackgroundDp) ?? false}
          barContainerStyle={p.barContainerStyle as BarHorizontalProps['barContainerStyle']}
          barThickness={optionalNumber(p.barThickness, barThicknessDp) ?? 24}
          tickThickness={optionalNumber(p.tickThickness, tickThicknessDp) ?? 24}
          labelThickness={optionalNumber(p.labelThickness, labelThicknessDp) ?? 60}
          mainTickmarks={
            optionalNumberList(
              p.mainTickmarks,
              mainTickmarksDp,
            ) as BarHorizontalProps['mainTickmarks']
          }
          primaryTickmarkInterval={optionalNumber(
            p.primaryTickmarkInterval,
            primaryTickmarkIntervalDp,
          )}
          secondaryTickmarkInterval={optionalNumber(
            p.secondaryTickmarkInterval,
            secondaryTickmarkIntervalDp,
          )}
          tertiaryTickmarkInterval={optionalNumber(
            p.tertiaryTickmarkInterval,
            tertiaryTickmarkIntervalDp,
          )}
          scaleType={p.scaleType as BarHorizontalProps['scaleType']}
          frameStyle={p.frameStyle as BarHorizontalProps['frameStyle']}
          borderRadiusPosition={
            p.borderRadiusPosition as BarHorizontalProps['borderRadiusPosition']
          }
          instrumentMode={optionalBoolean(p.instrumentMode, instrumentModeDp) ?? false}
          borderRadius={optionalNumber(p.borderRadius, borderRadiusDp)}
          priority={
            (optionalBoolean(p.enhancedPriority, enhancedPriorityDp)
              ? 'enhanced'
              : 'regular') as BarHorizontalProps['priority']
          }
          fillMode={p.fillMode as BarHorizontalProps['fillMode']}
          fillMin={optionalNumber(p.fillMin, fillMinDp)}
          fillMax={optionalNumber(p.fillMax, fillMaxDp)}
          value={valueRaw ?? 0}
          state={deriveInstrumentState({
            isOff: optionalBoolean(p.isOff, isOffDp),
            isLoading: optionalBoolean(p.isLoading, isLoadingDp),
            valueAvailable: valueRaw !== undefined,
          })}
          advicePosition={p.advicePosition as BarHorizontalProps['advicePosition']}
          advices={
            buildLinearAdvices([
              {
                type: AdviceType.advice,
                enabled: optionalBoolean(p.adviceEnabled, adviceEnabledDp),
                min: optionalNumber(p.adviceMin, adviceMinDp),
                max: optionalNumber(p.adviceMax, adviceMaxDp),
                hinted: optionalBoolean(p.adviceHinted, adviceHintedDp),
              },
              {
                type: AdviceType.caution,
                enabled: optionalBoolean(p.cautionEnabled, cautionEnabledDp),
                min: optionalNumber(p.cautionMin, cautionMinDp),
                max: optionalNumber(p.cautionMax, cautionMaxDp),
                hinted: optionalBoolean(p.cautionHinted, cautionHintedDp),
              },
            ]) as BarHorizontalProps['advices']
          }
          highlightCurrentValue={
            optionalBoolean(p.highlightCurrentValue, highlightCurrentValueDp) ?? false
          }
          setpoint={optionalNumber(p.setpoint, setpointDp)}
          atSetpoint={optionalBoolean(p.atSetpoint, atSetpointDp) ?? false}
          autoAtSetpoint={optionalBoolean(p.autoAtSetpoint, autoAtSetpointDp) ?? true}
          autoAtSetpointDeadband={optionalNumber(
            p.autoAtSetpointDeadband,
            autoAtSetpointDeadbandDp,
          )}
          setpointAtZeroDeadband={optionalNumber(
            p.setpointAtZeroDeadband,
            setpointAtZeroDeadbandDp,
          )}
          setpointOverride={optionalBoolean(p.setpointOverride, setpointOverrideDp) ?? false}
          animateSetpoint={optionalBoolean(p.animateSetpoint, animateSetpointDp) ?? false}
          onScaleDimensionsChanged={
            interactive
              ? () => {
                  if (onScaleDimensionsChangedAction.canCall === true)
                    onScaleDimensionsChangedAction.call();
                }
              : undefined
          }
          onClick={clickable ? onClick.call : undefined}
        />
      </Fragment>
    );
  },
});
