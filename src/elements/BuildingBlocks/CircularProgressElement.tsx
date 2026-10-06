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
import {
  CircularProgress,
  type CircularProgressProps,
} from '../../components/BuildingBlocks/CircularProgress';
import { optionalNumber } from '../../utils/valueMapping';

export const circularProgressElement = createElement(namespace, {
  name: 'OpenBridge Circular Progress',
  description: 'Ring-shaped progress indicator (OpenBridge design system).',
  category: 'OpenBridge Building Blocks',
  icon: { name: 'Dashboard' },

  traits: [traits.Control],

  propsGroups: {
    data: { label: 'Values' },
    display: { label: 'Display' },
    interaction: { label: 'Interaction', defaultClosed: true },
  },

  propsSchema: createPropsSchema().initial({
    mode: props.Enum({
      label: 'Mode',
      propGroup: 'display',
      options: ['determinate', 'indeterminate', 'progressive-indeterminate'],
      optional: true,
    }),
    value: props.DynamicProperty({
      label: 'Value (default 0)',
      propGroup: 'data',
      valueType: 'NumericValue',
      optional: true,
    }),
    strokeWidth: props.DynamicProperty({
      label: 'Stroke width (default 4)',
      propGroup: 'display',
      valueType: 'NumericValue',
      optional: true,
    }),
    viewBoxSize: props.DynamicProperty({
      label: 'View box size (default 42)',
      propGroup: 'display',
      valueType: 'NumericValue',
      optional: true,
    }),
    padding: props.DynamicProperty({
      label: 'Padding (default 0)',
      propGroup: 'display',
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
    const renderMode = useRenderMode();
    const interactive = renderMode !== 'PreviewEdit';

    const valueDp = useDynamicProperty(p.value, { valueType: values.Number() });
    const strokeWidthDp = useDynamicProperty(p.strokeWidth, { valueType: values.Number() });
    const viewBoxSizeDp = useDynamicProperty(p.viewBoxSize, { valueType: values.Number() });
    const paddingDp = useDynamicProperty(p.padding, { valueType: values.Number() });

    const onClick = useAction(p.onClick);

    // Dynamic properties need to be mounted to subscribe to value changes.
    const subscriptions = [valueDp, strokeWidthDp, viewBoxSizeDp, paddingDp];

    const clickable = onClick.canCall === true && interactive;

    return (
      <Fragment>
        {subscriptions.map((dp, index) => (
          <Fragment key={index}>{dp.render()}</Fragment>
        ))}
        {onClick.render()}

        <CircularProgress
          mode={p.mode as CircularProgressProps['mode']}
          value={optionalNumber(p.value, valueDp) ?? 0}
          strokeWidth={optionalNumber(p.strokeWidth, strokeWidthDp) ?? 4}
          viewBoxSize={optionalNumber(p.viewBoxSize, viewBoxSizeDp) ?? 42}
          padding={optionalNumber(p.padding, paddingDp) ?? 0}
          onClick={clickable ? onClick.call : undefined}
        />
      </Fragment>
    );
  },
});
