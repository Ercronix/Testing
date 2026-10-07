import {
  createElement,
  createPropsSchema,
  props,
  traits,
  useAction,
  useDynamicProperty,
  useRenderMode,
  values,
} from '@hmiproject/helio-sdk';
import { Fragment } from 'react';
import { namespace } from '../../namespace';
import { useOpenBridgeTheme } from '../../utils/OpenBridgeTheme';
import { Watch, type WatchProps } from '../../components/BuildingBlocks/Watch';
import {
  deriveInstrumentState,
  optionalBoolean,
  optionalJson,
  optionalNumber,
  optionalString,
} from '../../utils/valueMapping';

export const watchElement = createElement(namespace, {
  name: 'OpenBridge Watch',
  description:
    'Core SVG renderer for circular/radial watch-based instruments (OpenBridge design system).',
  category: 'OpenBridge Building Blocks',
  icon: { name: 'Dashboard' },

  traits: [traits.Control],

  propsGroups: {
    data: { label: 'Values' },
    setpoint: { label: 'Setpoint' },
    display: { label: 'Display' },
    north: { label: 'North', defaultClosed: true },
    clip: { label: 'Clip', defaultClosed: true },
    rot: { label: 'ROT', defaultClosed: true },
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
    watchCircleType: props.Enum({
      label: 'Watch circle type',
      propGroup: 'display',
      options: ['single', 'double', 'doubleThin', 'triple'],
      optional: true,
    }),
    hasBackgroundCircle: props.DynamicProperty({
      label: 'Has background circle (default false)',
      propGroup: 'display',
      valueType: 'Boolean',
      optional: true,
    }),
    northArrow: props.DynamicProperty({
      label: 'North arrow (default false)',
      propGroup: 'north',
      valueType: 'Boolean',
      optional: true,
    }),
    northArrowInside: props.DynamicProperty({
      label: 'North arrow inside',
      propGroup: 'north',
      valueType: 'Boolean',
      optional: true,
    }),
    northMarker: props.DynamicProperty({
      label: 'North marker (default false)',
      propGroup: 'north',
      valueType: 'Boolean',
      optional: true,
    }),
    angleSetpoint: props.DynamicProperty({
      label: 'Angle setpoint',
      propGroup: 'setpoint',
      valueType: 'NumericValue',
      optional: true,
    }),
    atAngleSetpoint: props.DynamicProperty({
      label: 'At angle setpoint (default false)',
      propGroup: 'setpoint',
      valueType: 'Boolean',
      optional: true,
    }),
    angleSetpointAtZeroDeadband: props.DynamicProperty({
      label: 'Angle setpoint at zero deadband (default 0.5)',
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
    padding: props.DynamicProperty({
      label: 'Padding',
      propGroup: 'display',
      valueType: 'NumericValue',
      optional: true,
    }),
    areas: props.DynamicProperty({
      label: 'Areas (JSON)',
      propGroup: 'display',
      valueType: '*',
      optional: true,
    }),
    barAreas: props.DynamicProperty({
      label: 'Bar areas (JSON)',
      propGroup: 'display',
      valueType: '*',
      optional: true,
    }),
    roundBandCuts: props.DynamicProperty({
      label: 'Round band cuts (default false)',
      propGroup: 'display',
      valueType: 'Boolean',
      optional: true,
    }),
    splitBand: props.DynamicProperty({
      label: 'Split band (default false)',
      propGroup: 'display',
      valueType: 'Boolean',
      optional: true,
    }),
    needles: props.DynamicProperty({
      label: 'Needles (JSON)',
      propGroup: 'display',
      valueType: '*',
      optional: true,
    }),
    tickmarks: props.DynamicProperty({
      label: 'Tickmarks (JSON)',
      propGroup: 'display',
      valueType: '*',
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
    advices: props.DynamicProperty({
      label: 'Advices (JSON)',
      propGroup: 'display',
      valueType: '*',
      optional: true,
    }),
    crosshairEnabled: props.DynamicProperty({
      label: 'Crosshair enabled (default false)',
      propGroup: 'display',
      valueType: 'Boolean',
      optional: true,
    }),
    crosshairCenterCutout: props.DynamicProperty({
      label: 'Crosshair center cutout (default false)',
      propGroup: 'display',
      valueType: 'Boolean',
      optional: true,
    }),
    showLabels: props.DynamicProperty({
      label: 'Show labels (default false)',
      propGroup: 'display',
      valueType: 'Boolean',
      optional: true,
    }),
    insideLabelsFlush: props.DynamicProperty({
      label: 'Inside labels flush (default false)',
      propGroup: 'display',
      valueType: 'Boolean',
      optional: true,
    }),
    vessels: props.DynamicProperty({
      label: 'Vessels (JSON)',
      propGroup: 'display',
      valueType: '*',
      optional: true,
    }),
    windKnots: props.DynamicProperty({
      label: 'Wind knots',
      propGroup: 'data',
      valueType: 'NumericValue',
      optional: true,
    }),
    windFromDirectionDeg: props.DynamicProperty({
      label: 'Wind from direction deg',
      propGroup: 'data',
      valueType: 'NumericValue',
      optional: true,
    }),
    windSymbolRadius: props.DynamicProperty({
      label: 'Wind symbol radius',
      propGroup: 'data',
      valueType: 'NumericValue',
      optional: true,
    }),
    windColor: props.DynamicProperty({
      label: 'Wind color',
      propGroup: 'data',
      valueType: 'String',
      optional: true,
    }),
    current: props.DynamicProperty({
      label: 'Current',
      propGroup: 'data',
      valueType: 'NumericValue',
      optional: true,
    }),
    currentFromDirectionDeg: props.DynamicProperty({
      label: 'Current from direction deg',
      propGroup: 'data',
      valueType: 'NumericValue',
      optional: true,
    }),
    currentSymbolRadius: props.DynamicProperty({
      label: 'Current symbol radius',
      propGroup: 'data',
      valueType: 'NumericValue',
      optional: true,
    }),
    currentColor: props.DynamicProperty({
      label: 'Current color',
      propGroup: 'data',
      valueType: 'String',
      optional: true,
    }),
    currentIconCentered: props.DynamicProperty({
      label: 'Current icon centered (default false)',
      propGroup: 'data',
      valueType: 'Boolean',
      optional: true,
    }),
    scaleCurrentIcon: props.DynamicProperty({
      label: 'Scale current icon (default 1)',
      propGroup: 'display',
      valueType: 'NumericValue',
      optional: true,
    }),
    starboardPortIndicator: props.DynamicProperty({
      label: 'Starboard port indicator (default false)',
      propGroup: 'display',
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
    scaleWindIcon: props.DynamicProperty({
      label: 'Scale wind icon (default 1)',
      propGroup: 'display',
      valueType: 'NumericValue',
      optional: true,
    }),
    rotation: props.DynamicProperty({
      label: 'Rotation',
      propGroup: 'display',
      valueType: 'NumericValue',
      optional: true,
    }),
    zoomToFitArc: props.DynamicProperty({
      label: 'Zoom to fit arc (default false)',
      propGroup: 'display',
      valueType: 'Boolean',
      optional: true,
    }),
    arcFrame: props.DynamicProperty({
      label: 'Arc frame (JSON)',
      propGroup: 'display',
      valueType: '*',
      optional: true,
    }),
    tickFadeAngle: props.DynamicProperty({
      label: 'Tick fade angle (default 0)',
      propGroup: 'display',
      valueType: 'NumericValue',
      optional: true,
    }),
    rotType: props.Enum({
      label: 'ROT type',
      propGroup: 'rot',
      options: ['dots', 'bar'],
      optional: true,
    }),
    rotPosition: props.Enum({
      label: 'ROT position',
      propGroup: 'rot',
      options: ['scale', 'innerCircle'],
      optional: true,
    }),
    rotStartAngle: props.DynamicProperty({
      label: 'ROT start angle (default 0)',
      propGroup: 'rot',
      valueType: 'NumericValue',
      optional: true,
    }),
    rotEndAngle: props.DynamicProperty({
      label: 'ROT end angle (default 0)',
      propGroup: 'rot',
      valueType: 'NumericValue',
      optional: true,
    }),
    rotPriority: props.Enum({
      label: 'ROT priority',
      propGroup: 'rot',
      options: ['regular', 'enhanced'],
      optional: true,
    }),
    rotPortStarboard: props.DynamicProperty({
      label: 'ROT port starboard (default false)',
      propGroup: 'rot',
      valueType: 'Boolean',
      optional: true,
    }),
    rotAtZeroDeadband: props.DynamicProperty({
      label: 'ROT at zero deadband',
      propGroup: 'rot',
      valueType: 'NumericValue',
      optional: true,
    }),
    rateOfTurnDegreesPerMinute: props.DynamicProperty({
      label: 'Rate of turn degrees per minute',
      propGroup: 'data',
      valueType: 'NumericValue',
      optional: true,
    }),
    rotDotAnimationFactor: props.DynamicProperty({
      label: 'ROT dot animation factor (default 18)',
      propGroup: 'rot',
      valueType: 'NumericValue',
      optional: true,
    }),
    onClick: props.Action({
      label: 'On click',
      propGroup: 'interaction',
      optional: true,
    }),
  }),

  Component(p) {
    useOpenBridgeTheme();
    const renderMode = useRenderMode();
    const interactive = renderMode !== 'PreviewEdit';

    const isOffDp = useDynamicProperty(p.isOff, { valueType: values.Boolean() });
    const isLoadingDp = useDynamicProperty(p.isLoading, { valueType: values.Boolean() });
    const enhancedPriorityDp = useDynamicProperty(p.enhancedPriority, {
      valueType: values.Boolean(),
    });
    const hasBackgroundCircleDp = useDynamicProperty(p.hasBackgroundCircle, {
      valueType: values.Boolean(),
    });
    const northArrowDp = useDynamicProperty(p.northArrow, { valueType: values.Boolean() });
    const northArrowInsideDp = useDynamicProperty(p.northArrowInside, {
      valueType: values.Boolean(),
    });
    const northMarkerDp = useDynamicProperty(p.northMarker, { valueType: values.Boolean() });
    const angleSetpointDp = useDynamicProperty(p.angleSetpoint, { valueType: values.Number() });
    const atAngleSetpointDp = useDynamicProperty(p.atAngleSetpoint, {
      valueType: values.Boolean(),
    });
    const angleSetpointAtZeroDeadbandDp = useDynamicProperty(p.angleSetpointAtZeroDeadband, {
      valueType: values.Number(),
    });
    const setpointOverrideDp = useDynamicProperty(p.setpointOverride, {
      valueType: values.Boolean(),
    });
    const animateSetpointDp = useDynamicProperty(p.animateSetpoint, {
      valueType: values.Boolean(),
    });
    const paddingDp = useDynamicProperty(p.padding, { valueType: values.Number() });
    const areasDp = useDynamicProperty(p.areas);
    const barAreasDp = useDynamicProperty(p.barAreas);
    const roundBandCutsDp = useDynamicProperty(p.roundBandCuts, { valueType: values.Boolean() });
    const splitBandDp = useDynamicProperty(p.splitBand, { valueType: values.Boolean() });
    const needlesDp = useDynamicProperty(p.needles);
    const tickmarksDp = useDynamicProperty(p.tickmarks);
    const tickmarksInsideDp = useDynamicProperty(p.tickmarksInside, {
      valueType: values.Boolean(),
    });
    const advicesDp = useDynamicProperty(p.advices);
    const crosshairEnabledDp = useDynamicProperty(p.crosshairEnabled, {
      valueType: values.Boolean(),
    });
    const crosshairCenterCutoutDp = useDynamicProperty(p.crosshairCenterCutout, {
      valueType: values.Boolean(),
    });
    const showLabelsDp = useDynamicProperty(p.showLabels, { valueType: values.Boolean() });
    const insideLabelsFlushDp = useDynamicProperty(p.insideLabelsFlush, {
      valueType: values.Boolean(),
    });
    const vesselsDp = useDynamicProperty(p.vessels);
    const windKnotsDp = useDynamicProperty(p.windKnots, { valueType: values.Number() });
    const windFromDirectionDegDp = useDynamicProperty(p.windFromDirectionDeg, {
      valueType: values.Number(),
    });
    const windSymbolRadiusDp = useDynamicProperty(p.windSymbolRadius, {
      valueType: values.Number(),
    });
    const windColorDp = useDynamicProperty(p.windColor, { valueType: values.String() });
    const currentDp = useDynamicProperty(p.current, { valueType: values.Number() });
    const currentFromDirectionDegDp = useDynamicProperty(p.currentFromDirectionDeg, {
      valueType: values.Number(),
    });
    const currentSymbolRadiusDp = useDynamicProperty(p.currentSymbolRadius, {
      valueType: values.Number(),
    });
    const currentColorDp = useDynamicProperty(p.currentColor, { valueType: values.String() });
    const currentIconCenteredDp = useDynamicProperty(p.currentIconCentered, {
      valueType: values.Boolean(),
    });
    const scaleCurrentIconDp = useDynamicProperty(p.scaleCurrentIcon, {
      valueType: values.Number(),
    });
    const starboardPortIndicatorDp = useDynamicProperty(p.starboardPortIndicator, {
      valueType: values.Boolean(),
    });
    const clipTopDp = useDynamicProperty(p.clipTop, { valueType: values.Number() });
    const clipBottomDp = useDynamicProperty(p.clipBottom, { valueType: values.Number() });
    const clipLeftDp = useDynamicProperty(p.clipLeft, { valueType: values.Number() });
    const clipRightDp = useDynamicProperty(p.clipRight, { valueType: values.Number() });
    const endLabelsMaxMinDp = useDynamicProperty(p.endLabelsMaxMin, {
      valueType: values.Boolean(),
    });
    const scaleWindIconDp = useDynamicProperty(p.scaleWindIcon, { valueType: values.Number() });
    const rotationDp = useDynamicProperty(p.rotation, { valueType: values.Number() });
    const zoomToFitArcDp = useDynamicProperty(p.zoomToFitArc, { valueType: values.Boolean() });
    const arcFrameDp = useDynamicProperty(p.arcFrame);
    const tickFadeAngleDp = useDynamicProperty(p.tickFadeAngle, { valueType: values.Number() });
    const rotStartAngleDp = useDynamicProperty(p.rotStartAngle, { valueType: values.Number() });
    const rotEndAngleDp = useDynamicProperty(p.rotEndAngle, { valueType: values.Number() });
    const rotPortStarboardDp = useDynamicProperty(p.rotPortStarboard, {
      valueType: values.Boolean(),
    });
    const rotAtZeroDeadbandDp = useDynamicProperty(p.rotAtZeroDeadband, {
      valueType: values.Number(),
    });
    const rateOfTurnDegreesPerMinuteDp = useDynamicProperty(p.rateOfTurnDegreesPerMinute, {
      valueType: values.Number(),
    });
    const rotDotAnimationFactorDp = useDynamicProperty(p.rotDotAnimationFactor, {
      valueType: values.Number(),
    });

    const onClick = useAction(p.onClick);

    // Dynamic properties need to be mounted to subscribe to value changes.
    const subscriptions = [
      isOffDp,
      isLoadingDp,
      enhancedPriorityDp,
      hasBackgroundCircleDp,
      northArrowDp,
      northArrowInsideDp,
      northMarkerDp,
      angleSetpointDp,
      atAngleSetpointDp,
      angleSetpointAtZeroDeadbandDp,
      setpointOverrideDp,
      animateSetpointDp,
      paddingDp,
      areasDp,
      barAreasDp,
      roundBandCutsDp,
      splitBandDp,
      needlesDp,
      tickmarksDp,
      tickmarksInsideDp,
      advicesDp,
      crosshairEnabledDp,
      crosshairCenterCutoutDp,
      showLabelsDp,
      insideLabelsFlushDp,
      vesselsDp,
      windKnotsDp,
      windFromDirectionDegDp,
      windSymbolRadiusDp,
      windColorDp,
      currentDp,
      currentFromDirectionDegDp,
      currentSymbolRadiusDp,
      currentColorDp,
      currentIconCenteredDp,
      scaleCurrentIconDp,
      starboardPortIndicatorDp,
      clipTopDp,
      clipBottomDp,
      clipLeftDp,
      clipRightDp,
      endLabelsMaxMinDp,
      scaleWindIconDp,
      rotationDp,
      zoomToFitArcDp,
      arcFrameDp,
      tickFadeAngleDp,
      rotStartAngleDp,
      rotEndAngleDp,
      rotPortStarboardDp,
      rotAtZeroDeadbandDp,
      rateOfTurnDegreesPerMinuteDp,
      rotDotAnimationFactorDp,
    ];

    const clickable = onClick.canCall === true && interactive;

    return (
      <Fragment>
        {subscriptions.map((dp, index) => (
          <Fragment key={index}>{dp.render()}</Fragment>
        ))}
        {onClick.render()}

        <Watch
          state={deriveInstrumentState({
            isOff: optionalBoolean(p.isOff, isOffDp),
            isLoading: optionalBoolean(p.isLoading, isLoadingDp),
            valueAvailable: true,
          })}
          priority={
            (optionalBoolean(p.enhancedPriority, enhancedPriorityDp)
              ? 'enhanced'
              : 'regular') as WatchProps['priority']
          }
          watchCircleType={p.watchCircleType as WatchProps['watchCircleType']}
          hasBackgroundCircle={
            optionalBoolean(p.hasBackgroundCircle, hasBackgroundCircleDp) ?? false
          }
          northArrow={optionalBoolean(p.northArrow, northArrowDp) ?? false}
          northArrowInside={optionalBoolean(p.northArrowInside, northArrowInsideDp)}
          northMarker={optionalBoolean(p.northMarker, northMarkerDp) ?? false}
          angleSetpoint={optionalNumber(p.angleSetpoint, angleSetpointDp)}
          atAngleSetpoint={optionalBoolean(p.atAngleSetpoint, atAngleSetpointDp) ?? false}
          angleSetpointAtZeroDeadband={
            optionalNumber(p.angleSetpointAtZeroDeadband, angleSetpointAtZeroDeadbandDp) ?? 0.5
          }
          setpointOverride={optionalBoolean(p.setpointOverride, setpointOverrideDp) ?? false}
          animateSetpoint={optionalBoolean(p.animateSetpoint, animateSetpointDp) ?? false}
          padding={optionalNumber(p.padding, paddingDp)}
          areas={optionalJson(p.areas, areasDp) as WatchProps['areas']}
          barAreas={optionalJson(p.barAreas, barAreasDp) as WatchProps['barAreas']}
          roundBandCuts={optionalBoolean(p.roundBandCuts, roundBandCutsDp) ?? false}
          splitBand={optionalBoolean(p.splitBand, splitBandDp) ?? false}
          needles={optionalJson(p.needles, needlesDp) as WatchProps['needles']}
          tickmarks={optionalJson(p.tickmarks, tickmarksDp) as WatchProps['tickmarks']}
          tickmarksInside={optionalBoolean(p.tickmarksInside, tickmarksInsideDp) ?? false}
          tickmarkStyle={p.tickmarkStyle as WatchProps['tickmarkStyle']}
          advices={optionalJson(p.advices, advicesDp) as WatchProps['advices']}
          crosshairEnabled={optionalBoolean(p.crosshairEnabled, crosshairEnabledDp) ?? false}
          crosshairCenterCutout={
            optionalBoolean(p.crosshairCenterCutout, crosshairCenterCutoutDp) ?? false
          }
          showLabels={optionalBoolean(p.showLabels, showLabelsDp) ?? false}
          insideLabelsFlush={optionalBoolean(p.insideLabelsFlush, insideLabelsFlushDp) ?? false}
          vessels={optionalJson(p.vessels, vesselsDp) as WatchProps['vessels']}
          windKnots={optionalNumber(p.windKnots, windKnotsDp)}
          windFromDirectionDeg={optionalNumber(p.windFromDirectionDeg, windFromDirectionDegDp)}
          windSymbolRadius={optionalNumber(p.windSymbolRadius, windSymbolRadiusDp)}
          windColor={optionalString(p.windColor, windColorDp)}
          current={optionalNumber(p.current, currentDp)}
          currentFromDirectionDeg={optionalNumber(
            p.currentFromDirectionDeg,
            currentFromDirectionDegDp,
          )}
          currentSymbolRadius={optionalNumber(p.currentSymbolRadius, currentSymbolRadiusDp)}
          currentColor={optionalString(p.currentColor, currentColorDp)}
          currentIconCentered={
            optionalBoolean(p.currentIconCentered, currentIconCenteredDp) ?? false
          }
          scaleCurrentIcon={optionalNumber(p.scaleCurrentIcon, scaleCurrentIconDp) ?? 1}
          starboardPortIndicator={
            optionalBoolean(p.starboardPortIndicator, starboardPortIndicatorDp) ?? false
          }
          clipTop={optionalNumber(p.clipTop, clipTopDp) ?? 0}
          clipBottom={optionalNumber(p.clipBottom, clipBottomDp) ?? 0}
          clipLeft={optionalNumber(p.clipLeft, clipLeftDp) ?? 0}
          clipRight={optionalNumber(p.clipRight, clipRightDp) ?? 0}
          endLabelsMaxMin={optionalBoolean(p.endLabelsMaxMin, endLabelsMaxMinDp) ?? false}
          scaleWindIcon={optionalNumber(p.scaleWindIcon, scaleWindIconDp) ?? 1}
          rotation={optionalNumber(p.rotation, rotationDp)}
          zoomToFitArc={optionalBoolean(p.zoomToFitArc, zoomToFitArcDp) ?? false}
          arcFrame={optionalJson(p.arcFrame, arcFrameDp) as WatchProps['arcFrame']}
          tickFadeAngle={optionalNumber(p.tickFadeAngle, tickFadeAngleDp) ?? 0}
          rotType={p.rotType as WatchProps['rotType']}
          rotPosition={p.rotPosition as WatchProps['rotPosition']}
          rotStartAngle={optionalNumber(p.rotStartAngle, rotStartAngleDp) ?? 0}
          rotEndAngle={optionalNumber(p.rotEndAngle, rotEndAngleDp) ?? 0}
          rotPriority={p.rotPriority as WatchProps['rotPriority']}
          rotPortStarboard={optionalBoolean(p.rotPortStarboard, rotPortStarboardDp) ?? false}
          rotAtZeroDeadband={optionalNumber(p.rotAtZeroDeadband, rotAtZeroDeadbandDp)}
          rateOfTurnDegreesPerMinute={
            optionalNumber(p.rateOfTurnDegreesPerMinute, rateOfTurnDegreesPerMinuteDp) ?? 0
          }
          rotDotAnimationFactor={
            optionalNumber(p.rotDotAnimationFactor, rotDotAnimationFactorDp) ?? 18
          }
          onClick={clickable ? onClick.call : undefined}
        />
      </Fragment>
    );
  },
});
