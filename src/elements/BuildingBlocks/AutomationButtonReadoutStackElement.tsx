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
import {
  AutomationButtonReadoutStack,
  type AutomationButtonReadoutStackProps,
} from '../../components/BuildingBlocks/AutomationButtonReadoutStack';
import { optionalJson, optionalString } from '../../utils/valueMapping';

export const automationButtonReadoutStackElement = createElement(namespace, {
  name: 'OpenBridge Automation Button Readout Stack',
  description:
    "A value row with `icon: 'slot'` projects its icon from the host slot named by its `slotName` — a dynamic slot name, so it carries no `@slot` tag (the wrapper generator needs literal names) (OpenBridge design system).",
  category: 'OpenBridge Building Blocks',
  icon: { name: 'Toggles' },

  traits: [traits.Control],

  propsGroups: {
    display: { label: 'Display' },
    interaction: { label: 'Interaction', defaultClosed: true },
  },

  propsSchema: createPropsSchema().initial({
    readouts: props.DynamicProperty({
      label: 'Readouts (JSON)',
      propGroup: 'display',
      valueType: '*',
      optional: true,
    }),
    tag: props.DynamicProperty({
      label: 'Tag',
      propGroup: 'display',
      valueType: 'String',
      optional: true,
    }),
    size: props.Enum({
      label: 'Size',
      propGroup: 'display',
      options: ['small', 'regular', 'enhanced'],
      optional: true,
    }),
    idTagOrientation: props.Enum({
      label: 'ID tag orientation',
      propGroup: 'display',
      options: ['top', 'bottom'],
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

    const readoutsDp = useDynamicProperty(p.readouts);
    const tagDp = useDynamicProperty(p.tag, { valueType: values.String() });

    const onClick = useAction(p.onClick);

    // Dynamic properties need to be mounted to subscribe to value changes.
    const subscriptions = [readoutsDp, tagDp];

    const clickable = onClick.canCall === true && interactive;

    return (
      <Fragment>
        {subscriptions.map((dp, index) => (
          <Fragment key={index}>{dp.render()}</Fragment>
        ))}
        {onClick.render()}

        <AutomationButtonReadoutStack
          readouts={
            optionalJson(p.readouts, readoutsDp) as AutomationButtonReadoutStackProps['readouts']
          }
          tag={optionalString(p.tag, tagDp)}
          size={p.size as AutomationButtonReadoutStackProps['size']}
          idTagOrientation={
            p.idTagOrientation as AutomationButtonReadoutStackProps['idTagOrientation']
          }
          onClick={clickable ? onClick.call : undefined}
        />
      </Fragment>
    );
  },
});
