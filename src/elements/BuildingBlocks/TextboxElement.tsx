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
import { Textbox, type TextboxProps } from '../../components/BuildingBlocks/Textbox';
import { optionalBoolean } from '../../utils/valueMapping';

export const textboxElement = createElement(namespace, {
  name: 'OpenBridge Textbox',
  description:
    'A text container that renders inline text at a precise, cap-height-trimmed size with configurable alignment and reservable width (OpenBridge design system).',
  category: 'OpenBridge Building Blocks',
  icon: { name: 'Dashboard' },

  traits: [traits.Control],

  propsGroups: {
    display: { label: 'Display' },
    interaction: { label: 'Interaction', defaultClosed: true },
  },

  propsSchema: createPropsSchema().initial({
    alignment: props.Enum({
      label: 'Alignment',
      propGroup: 'display',
      options: ['left', 'center', 'right'],
      optional: true,
    }),
    size: props.Enum({
      label: 'Size',
      propGroup: 'display',
      options: ['xs', 's', 'm', 'l', 'xl'],
      optional: true,
    }),
    fontWeight: props.Enum({
      label: 'Font weight',
      propGroup: 'display',
      options: ['regular', 'semibold', 'bold'],
      optional: true,
    }),
    tabularNums: props.DynamicProperty({
      label: 'Tabular nums (default false)',
      propGroup: 'display',
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
    const interactive = renderMode !== 'PreviewEdit';

    const tabularNumsDp = useDynamicProperty(p.tabularNums, { valueType: values.Boolean() });

    const onClick = useAction(p.onClick);

    // Dynamic properties need to be mounted to subscribe to value changes.
    const subscriptions = [tabularNumsDp];

    const clickable = onClick.canCall === true && interactive;

    return (
      <Fragment>
        {subscriptions.map((dp, index) => (
          <Fragment key={index}>{dp.render()}</Fragment>
        ))}
        {onClick.render()}

        <Textbox
          alignment={p.alignment as TextboxProps['alignment']}
          size={p.size as TextboxProps['size']}
          fontWeight={p.fontWeight as TextboxProps['fontWeight']}
          tabularNums={optionalBoolean(p.tabularNums, tabularNumsDp) ?? false}
          onClick={clickable ? onClick.call : undefined}
        />
      </Fragment>
    );
  },
});
