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
  SequenceLoadingSpinner,
  type SequenceLoadingSpinnerProps,
} from '../../components/BuildingBlocks/SequenceLoadingSpinner';
import { optionalNumber } from '../../utils/valueMapping';

export const sequenceLoadingSpinnerElement = createElement(namespace, {
  name: 'OpenBridge Sequence Loading Spinner',
  description: 'circular loading indicator for sequence UI (OpenBridge design system).',
  category: 'OpenBridge Building Blocks',
  icon: { name: 'Dashboard' },

  traits: [traits.Control],

  propsGroups: {
    display: { label: 'Display' },
    interaction: { label: 'Interaction', defaultClosed: true },
  },

  propsSchema: createPropsSchema().initial({
    type: props.Enum({
      label: 'Type',
      propGroup: 'display',
      options: ['indicator', 'indicator-point', 'tag', 'tag-point', 'button', 'button-point'],
      optional: true,
    }),
    progression: props.Enum({
      label: 'Progression',
      propGroup: 'display',
      options: ['determinate', 'scanning'],
      optional: true,
    }),
    rotationDurationMs: props.DynamicProperty({
      label: 'Rotation duration ms (default 1000)',
      propGroup: 'display',
      valueType: 'NumericValue',
      optional: true,
    }),
    progressPercent: props.DynamicProperty({
      label: 'Progress percent (default 0)',
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

    const rotationDurationMsDp = useDynamicProperty(p.rotationDurationMs, {
      valueType: values.Number(),
    });
    const progressPercentDp = useDynamicProperty(p.progressPercent, { valueType: values.Number() });

    const onClick = useAction(p.onClick);

    // Dynamic properties need to be mounted to subscribe to value changes.
    const subscriptions = [rotationDurationMsDp, progressPercentDp];

    const clickable = onClick.canCall === true && interactive;

    return (
      <Fragment>
        {subscriptions.map((dp, index) => (
          <Fragment key={index}>{dp.render()}</Fragment>
        ))}
        {onClick.render()}

        <SequenceLoadingSpinner
          type={p.type as SequenceLoadingSpinnerProps['type']}
          progression={p.progression as SequenceLoadingSpinnerProps['progression']}
          rotationDurationMs={optionalNumber(p.rotationDurationMs, rotationDurationMsDp) ?? 1000}
          progressPercent={optionalNumber(p.progressPercent, progressPercentDp) ?? 0}
          onClick={clickable ? onClick.call : undefined}
        />
      </Fragment>
    );
  },
});
