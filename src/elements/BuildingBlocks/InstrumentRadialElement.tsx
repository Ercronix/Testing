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
import {
  InstrumentRadial,
  type InstrumentRadialProps,
} from '../../components/BuildingBlocks/InstrumentRadial';
import {
  buildLinearAdvices,
  deriveInstrumentState,
  optionalBoolean,
  optionalNumber,
  optionalString,
  toFiniteNumber,
  writeValue,
} from '../../utils/valueMapping';

export const instrumentRadialElement = createElement(namespace, {
  name: 'OpenBridge Instrument Radial',
  description: 'Instrument Radial (OpenBridge design system).',
  category: 'OpenBridge Building Blocks',
  icon: { name: 'Dashboard' },

  traits: [traits.Control],

  propsGroups: {
    data: { label: 'Values' },
    setpoint: { label: 'Setpoint' },
    display: { label: 'Display' },
    clip: { label: 'Clip', defaultClosed: true },
    advicesZones: { label: 'Advice zones', defaultClosed: true },
    events: { label: 'Event values', defaultClosed: true },
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
    enhancedPriority: props.DynamicProperty({
      label: 'Enhanced priority (blue)',
      propGroup: 'display',
      valueType: 'Boolean',
      optional: true,
    }),
    value: props.DynamicProperty({
      label: 'Value',
      propGroup: 'data',
      valueType: 'NumericValue',
      optional: false,
      defaultValue: dynamicProperties.StaticValue(0),
    }),
    maxValue: props.DynamicProperty({
      label: 'Max value (default 100)',
      propGroup: 'display',
      valueType: 'NumericValue',
      optional: true,
    }),
    minValue: props.DynamicProperty({
      label: 'Min value (default 0)',
      propGroup: 'display',
      valueType: 'NumericValue',
      optional: true,
    }),
    needleColor: props.DynamicProperty({
      label: 'Needle color',
      propGroup: 'display',
      valueType: 'String',
      optional: true,
    }),
    barColor: props.DynamicProperty({
      label: 'Bar color',
      propGroup: 'display',
      valueType: 'String',
      optional: true,
    }),
    showLabels: props.DynamicProperty({
      label: 'Show labels (default false)',
      propGroup: 'display',
      valueType: 'Boolean',
      optional: true,
    }),
    primaryTickmarkInterval: props.DynamicProperty({
      label: 'Primary tickmark interval (default 50)',
      propGroup: 'display',
      valueType: 'NumericValue',
      optional: true,
    }),
    secondaryTickmarkInterval: props.DynamicProperty({
      label: 'Secondary tickmark interval (default 10)',
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
    type: props.Enum({
      label: 'Type',
      propGroup: 'display',
      options: ['filled', 'bar', 'needle'],
      optional: true,
    }),
    needleType: props.Enum({
      label: 'Needle type',
      propGroup: 'display',
      options: ['filled', 'bar', 'needle'],
      optional: true,
    }),
    tickmarksInside: props.DynamicProperty({
      label: 'Tickmarks inside (default false)',
      propGroup: 'display',
      valueType: 'Boolean',
      optional: true,
    }),
    tickmarkStyle: props.Enum({
      label: 'Tickmark style',
      propGroup: 'display',
      options: ['regular', 'enhanced'],
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
    clipTop: props.DynamicProperty({
      label: 'Clip top (default 0)',
      propGroup: 'clip',
      valueType: 'NumericValue',
      optional: true,
    }),
    clipBottom: props.DynamicProperty({
      label: 'Clip bottom (default 0)',
      propGroup: 'clip',
      valueType: 'NumericValue',
      optional: true,
    }),
    clipLeft: props.DynamicProperty({
      label: 'Clip left (default 0)',
      propGroup: 'clip',
      valueType: 'NumericValue',
      optional: true,
    }),
    clipRight: props.DynamicProperty({
      label: 'Clip right (default 0)',
      propGroup: 'clip',
      valueType: 'NumericValue',
      optional: true,
    }),
    endLabelsMaxMin: props.DynamicProperty({
      label: 'End labels max min (default false)',
      propGroup: 'display',
      valueType: 'Boolean',
      optional: true,
    }),
    zoomToFitArc: props.DynamicProperty({
      label: 'Zoom to fit arc (default false)',
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
    frameChangedScaleTarget: props.DynamicProperty({
      label: 'Frame changed: scale → write to',
      propGroup: 'events',
      valueType: '*',
      optional: true,
    }),
    frameChangedLabelReserveTarget: props.DynamicProperty({
      label: 'Frame changed: labelReserve → write to',
      propGroup: 'events',
      valueType: '*',
      optional: true,
    }),
    frameChangedLabelsHiddenTarget: props.DynamicProperty({
      label: 'Frame changed: labelsHidden → write to',
      propGroup: 'events',
      valueType: '*',
      optional: true,
    }),
    frameChangedClipsAdjustedTarget: props.DynamicProperty({
      label: 'Frame changed: clipsAdjusted → write to',
      propGroup: 'events',
      valueType: '*',
      optional: true,
    }),
    frameChangedHostWidthPxTarget: props.DynamicProperty({
      label: 'Frame changed: hostWidthPx → write to',
      propGroup: 'events',
      valueType: '*',
      optional: true,
    }),
    frameChangedHostHeightPxTarget: props.DynamicProperty({
      label: 'Frame changed: hostHeightPx → write to',
      propGroup: 'events',
      valueType: '*',
      optional: true,
    }),
    onClick: props.Action({
      label: 'On click',
      propGroup: 'interaction',
      optional: true,
    }),
    onFrameChanged: props.Action({
      label: 'On frame changed',
      propGroup: 'interaction',
      optional: true,
    }),
  }),

  Component(p) {
    const renderMode = useRenderMode();
    const interactive = renderMode !== 'PreviewEdit';

    const isOffDp = useDynamicProperty(p.isOff, { valueType: values.Boolean() });
    const isLoadingDp = useDynamicProperty(p.isLoading, { valueType: values.Boolean() });
    const enhancedPriorityDp = useDynamicProperty(p.enhancedPriority, {
      valueType: values.Boolean(),
    });
    const valueDp = useDynamicProperty(p.value, { valueType: values.Number() });
    const maxValueDp = useDynamicProperty(p.maxValue, { valueType: values.Number() });
    const minValueDp = useDynamicProperty(p.minValue, { valueType: values.Number() });
    const needleColorDp = useDynamicProperty(p.needleColor, { valueType: values.String() });
    const barColorDp = useDynamicProperty(p.barColor, { valueType: values.String() });
    const showLabelsDp = useDynamicProperty(p.showLabels, { valueType: values.Boolean() });
    const primaryTickmarkIntervalDp = useDynamicProperty(p.primaryTickmarkInterval, {
      valueType: values.Number(),
    });
    const secondaryTickmarkIntervalDp = useDynamicProperty(p.secondaryTickmarkInterval, {
      valueType: values.Number(),
    });
    const tertiaryTickmarkIntervalDp = useDynamicProperty(p.tertiaryTickmarkInterval, {
      valueType: values.Number(),
    });
    const tickmarksInsideDp = useDynamicProperty(p.tickmarksInside, {
      valueType: values.Boolean(),
    });
    const adviceEnabledDp = useDynamicProperty(p.adviceEnabled, { valueType: values.Boolean() });
    const adviceMinDp = useDynamicProperty(p.adviceMin, { valueType: values.Number() });
    const adviceMaxDp = useDynamicProperty(p.adviceMax, { valueType: values.Number() });
    const adviceHintedDp = useDynamicProperty(p.adviceHinted, { valueType: values.Boolean() });
    const cautionEnabledDp = useDynamicProperty(p.cautionEnabled, { valueType: values.Boolean() });
    const cautionMinDp = useDynamicProperty(p.cautionMin, { valueType: values.Number() });
    const cautionMaxDp = useDynamicProperty(p.cautionMax, { valueType: values.Number() });
    const cautionHintedDp = useDynamicProperty(p.cautionHinted, { valueType: values.Boolean() });
    const clipTopDp = useDynamicProperty(p.clipTop, { valueType: values.Number() });
    const clipBottomDp = useDynamicProperty(p.clipBottom, { valueType: values.Number() });
    const clipLeftDp = useDynamicProperty(p.clipLeft, { valueType: values.Number() });
    const clipRightDp = useDynamicProperty(p.clipRight, { valueType: values.Number() });
    const endLabelsMaxMinDp = useDynamicProperty(p.endLabelsMaxMin, {
      valueType: values.Boolean(),
    });
    const zoomToFitArcDp = useDynamicProperty(p.zoomToFitArc, { valueType: values.Boolean() });
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
    const frameChangedScaleTargetDp = useDynamicProperty(p.frameChangedScaleTarget);
    const frameChangedLabelReserveTargetDp = useDynamicProperty(p.frameChangedLabelReserveTarget);
    const frameChangedLabelsHiddenTargetDp = useDynamicProperty(p.frameChangedLabelsHiddenTarget);
    const frameChangedClipsAdjustedTargetDp = useDynamicProperty(p.frameChangedClipsAdjustedTarget);
    const frameChangedHostWidthPxTargetDp = useDynamicProperty(p.frameChangedHostWidthPxTarget);
    const frameChangedHostHeightPxTargetDp = useDynamicProperty(p.frameChangedHostHeightPxTarget);

    const onClick = useAction(p.onClick);
    const onFrameChangedAction = useAction(p.onFrameChanged);

    // Dynamic properties need to be mounted to subscribe to value changes.
    const subscriptions = [
      isOffDp,
      isLoadingDp,
      enhancedPriorityDp,
      valueDp,
      maxValueDp,
      minValueDp,
      needleColorDp,
      barColorDp,
      showLabelsDp,
      primaryTickmarkIntervalDp,
      secondaryTickmarkIntervalDp,
      tertiaryTickmarkIntervalDp,
      tickmarksInsideDp,
      adviceEnabledDp,
      adviceMinDp,
      adviceMaxDp,
      adviceHintedDp,
      cautionEnabledDp,
      cautionMinDp,
      cautionMaxDp,
      cautionHintedDp,
      clipTopDp,
      clipBottomDp,
      clipLeftDp,
      clipRightDp,
      endLabelsMaxMinDp,
      zoomToFitArcDp,
      setpointDp,
      atSetpointDp,
      autoAtSetpointDp,
      autoAtSetpointDeadbandDp,
      setpointAtZeroDeadbandDp,
      setpointOverrideDp,
      animateSetpointDp,
      frameChangedScaleTargetDp,
      frameChangedLabelReserveTargetDp,
      frameChangedLabelsHiddenTargetDp,
      frameChangedClipsAdjustedTargetDp,
      frameChangedHostWidthPxTargetDp,
      frameChangedHostHeightPxTargetDp,
    ];

    const valueRaw = valueDp.canRead === false ? undefined : toFiniteNumber(valueDp.value);

    const clickable = onClick.canCall === true && interactive;

    return (
      <Fragment>
        {subscriptions.map((dp, index) => (
          <Fragment key={index}>{dp.render()}</Fragment>
        ))}
        {onClick.render()}
        {onFrameChangedAction.render()}

        <InstrumentRadial
          state={deriveInstrumentState({
            isOff: optionalBoolean(p.isOff, isOffDp),
            isLoading: optionalBoolean(p.isLoading, isLoadingDp),
            valueAvailable: valueRaw !== undefined,
          })}
          priority={
            (optionalBoolean(p.enhancedPriority, enhancedPriorityDp)
              ? 'enhanced'
              : 'regular') as InstrumentRadialProps['priority']
          }
          value={valueRaw ?? 0}
          maxValue={optionalNumber(p.maxValue, maxValueDp) ?? 100}
          minValue={optionalNumber(p.minValue, minValueDp) ?? 0}
          needleColor={optionalString(p.needleColor, needleColorDp)}
          barColor={optionalString(p.barColor, barColorDp)}
          showLabels={optionalBoolean(p.showLabels, showLabelsDp) ?? false}
          primaryTickmarkInterval={
            optionalNumber(p.primaryTickmarkInterval, primaryTickmarkIntervalDp) ?? 50
          }
          secondaryTickmarkInterval={
            optionalNumber(p.secondaryTickmarkInterval, secondaryTickmarkIntervalDp) ?? 10
          }
          tertiaryTickmarkInterval={optionalNumber(
            p.tertiaryTickmarkInterval,
            tertiaryTickmarkIntervalDp,
          )}
          type={p.type as InstrumentRadialProps['type']}
          needleType={p.needleType as InstrumentRadialProps['needleType']}
          tickmarksInside={optionalBoolean(p.tickmarksInside, tickmarksInsideDp) ?? false}
          tickmarkStyle={p.tickmarkStyle as InstrumentRadialProps['tickmarkStyle']}
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
            ]).map(({ min, max, ...rest }) => ({
              ...rest,
              minValue: min,
              maxValue: max,
            })) as InstrumentRadialProps['advices']
          }
          clipTop={optionalNumber(p.clipTop, clipTopDp) ?? 0}
          clipBottom={optionalNumber(p.clipBottom, clipBottomDp) ?? 0}
          clipLeft={optionalNumber(p.clipLeft, clipLeftDp) ?? 0}
          clipRight={optionalNumber(p.clipRight, clipRightDp) ?? 0}
          endLabelsMaxMin={optionalBoolean(p.endLabelsMaxMin, endLabelsMaxMinDp) ?? false}
          zoomToFitArc={optionalBoolean(p.zoomToFitArc, zoomToFitArcDp) ?? false}
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
          onFrameChanged={
            interactive
              ? (event) => {
                  writeValue(
                    p.frameChangedScaleTarget,
                    frameChangedScaleTargetDp,
                    event.detail?.scale,
                  );
                  writeValue(
                    p.frameChangedLabelReserveTarget,
                    frameChangedLabelReserveTargetDp,
                    event.detail?.labelReserve,
                  );
                  writeValue(
                    p.frameChangedLabelsHiddenTarget,
                    frameChangedLabelsHiddenTargetDp,
                    event.detail?.labelsHidden,
                  );
                  writeValue(
                    p.frameChangedClipsAdjustedTarget,
                    frameChangedClipsAdjustedTargetDp,
                    event.detail?.clipsAdjusted,
                  );
                  writeValue(
                    p.frameChangedHostWidthPxTarget,
                    frameChangedHostWidthPxTargetDp,
                    event.detail?.hostWidthPx,
                  );
                  writeValue(
                    p.frameChangedHostHeightPxTarget,
                    frameChangedHostHeightPxTargetDp,
                    event.detail?.hostHeightPx,
                  );
                  if (onFrameChangedAction.canCall === true) onFrameChangedAction.call();
                }
              : undefined
          }
          onClick={clickable ? onClick.call : undefined}
        />
      </Fragment>
    );
  },
});
