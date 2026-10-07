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
import { WatchFlat, type WatchFlatProps } from '../../components/BuildingBlocks/WatchFlat';
import { optionalBoolean, optionalJson, optionalNumber } from '../../utils/valueMapping';

export const watchFlatElement = createElement(namespace, {
  name: 'OpenBridge Watch Flat',
  description: 'Watch Flat (OpenBridge design system).',
  category: 'OpenBridge Building Blocks',
  icon: { name: 'Dashboard' },

  traits: [traits.Control],

  propsGroups: {
    data: { label: 'Values' },
    setpoint: { label: 'Setpoint' },
    display: { label: 'Display' },
    rot: { label: 'ROT', defaultClosed: true },
    interaction: { label: 'Interaction', defaultClosed: true },
  },

  propsSchema: createPropsSchema().initial({
    padding: props.DynamicProperty({
      label: 'Padding (default 0)',
      propGroup: 'display',
      valueType: 'NumericValue',
      optional: true,
    }),
    rotation: props.DynamicProperty({
      label: 'Rotation (default 0)',
      propGroup: 'display',
      valueType: 'NumericValue',
      optional: true,
    }),
    tickmarkSpacing: props.DynamicProperty({
      label: 'Tickmark spacing (default 0)',
      propGroup: 'display',
      valueType: 'NumericValue',
      optional: true,
    }),
    angleSetpoint: props.DynamicProperty({
      label: 'Angle setpoint',
      propGroup: 'setpoint',
      valueType: 'NumericValue',
      optional: true,
    }),
    tickmarks: props.DynamicProperty({
      label: 'Tickmarks (JSON)',
      propGroup: 'display',
      valueType: '*',
      optional: true,
    }),
    labels: props.DynamicProperty({
      label: 'Labels (JSON)',
      propGroup: 'display',
      valueType: '*',
      optional: true,
    }),
    borderRadius: props.DynamicProperty({
      label: 'Border radius (default 8)',
      propGroup: 'display',
      valueType: 'NumericValue',
      optional: true,
    }),
    bottomBar: props.DynamicProperty({
      label: 'Bottom bar (default false)',
      propGroup: 'display',
      valueType: 'Boolean',
      optional: true,
    }),
    barAreas: props.DynamicProperty({
      label: 'Bar areas (JSON)',
      propGroup: 'display',
      valueType: '*',
      optional: true,
    }),
    needles: props.DynamicProperty({
      label: 'Needles (JSON)',
      propGroup: 'display',
      valueType: '*',
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
      options: ['track', 'scale'],
      optional: true,
    }),
    rotStartX: props.DynamicProperty({
      label: 'ROT start x (default 0)',
      propGroup: 'rot',
      valueType: 'NumericValue',
      optional: true,
    }),
    rotEndX: props.DynamicProperty({
      label: 'ROT end x (default 0)',
      propGroup: 'rot',
      valueType: 'NumericValue',
      optional: true,
    }),
    rotDotSpacing: props.DynamicProperty({
      label: 'ROT dot spacing (default 0)',
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

    const paddingDp = useDynamicProperty(p.padding, { valueType: values.Number() });
    const rotationDp = useDynamicProperty(p.rotation, { valueType: values.Number() });
    const tickmarkSpacingDp = useDynamicProperty(p.tickmarkSpacing, { valueType: values.Number() });
    const angleSetpointDp = useDynamicProperty(p.angleSetpoint, { valueType: values.Number() });
    const tickmarksDp = useDynamicProperty(p.tickmarks);
    const labelsDp = useDynamicProperty(p.labels);
    const borderRadiusDp = useDynamicProperty(p.borderRadius, { valueType: values.Number() });
    const bottomBarDp = useDynamicProperty(p.bottomBar, { valueType: values.Boolean() });
    const barAreasDp = useDynamicProperty(p.barAreas);
    const needlesDp = useDynamicProperty(p.needles);
    const rotStartXDp = useDynamicProperty(p.rotStartX, { valueType: values.Number() });
    const rotEndXDp = useDynamicProperty(p.rotEndX, { valueType: values.Number() });
    const rotDotSpacingDp = useDynamicProperty(p.rotDotSpacing, { valueType: values.Number() });
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
      paddingDp,
      rotationDp,
      tickmarkSpacingDp,
      angleSetpointDp,
      tickmarksDp,
      labelsDp,
      borderRadiusDp,
      bottomBarDp,
      barAreasDp,
      needlesDp,
      rotStartXDp,
      rotEndXDp,
      rotDotSpacingDp,
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

        <WatchFlat
          padding={optionalNumber(p.padding, paddingDp) ?? 0}
          rotation={optionalNumber(p.rotation, rotationDp) ?? 0}
          tickmarkSpacing={optionalNumber(p.tickmarkSpacing, tickmarkSpacingDp) ?? 0}
          angleSetpoint={optionalNumber(p.angleSetpoint, angleSetpointDp)}
          tickmarks={optionalJson(p.tickmarks, tickmarksDp) as WatchFlatProps['tickmarks']}
          labels={optionalJson(p.labels, labelsDp) as WatchFlatProps['labels']}
          borderRadius={optionalNumber(p.borderRadius, borderRadiusDp) ?? 8}
          bottomBar={optionalBoolean(p.bottomBar, bottomBarDp) ?? false}
          barAreas={optionalJson(p.barAreas, barAreasDp) as WatchFlatProps['barAreas']}
          needles={optionalJson(p.needles, needlesDp) as WatchFlatProps['needles']}
          rotType={p.rotType as WatchFlatProps['rotType']}
          rotPosition={p.rotPosition as WatchFlatProps['rotPosition']}
          rotStartX={optionalNumber(p.rotStartX, rotStartXDp) ?? 0}
          rotEndX={optionalNumber(p.rotEndX, rotEndXDp) ?? 0}
          rotDotSpacing={optionalNumber(p.rotDotSpacing, rotDotSpacingDp) ?? 0}
          rotPriority={p.rotPriority as WatchFlatProps['rotPriority']}
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
