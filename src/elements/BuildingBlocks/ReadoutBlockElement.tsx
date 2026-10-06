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
import { ReadoutBlock, type ReadoutBlockProps } from '../../components/BuildingBlocks/ReadoutBlock';
import {
  optionalBoolean,
  optionalJson,
  optionalNumber,
  optionalPrimitive,
  optionalString,
} from '../../utils/valueMapping';

export const readoutBlockElement = createElement(namespace, {
  name: 'OpenBridge Readout Block',
  description:
    'the most atomic readout primitive: a single cap-height-aligned, width-reservable numeric segment (value / setpoint / advice) (OpenBridge design system).',
  category: 'OpenBridge Building Blocks',
  icon: { name: 'Tachometer' },

  traits: [traits.Control],

  propsGroups: {
    data: { label: 'Values' },
    display: { label: 'Display' },
    value: { label: 'Value', defaultClosed: true },
    interaction: { label: 'Interaction', defaultClosed: true },
  },

  propsSchema: createPropsSchema().initial({
    variant: props.Enum({
      label: 'Variant',
      propGroup: 'display',
      options: ['value', 'setpoint', 'advice'],
      optional: true,
    }),
    value: props.DynamicProperty({
      label: 'Value',
      propGroup: 'data',
      valueType: 'PrimitiveValue',
      optional: true,
    }),
    valueType: props.Enum({
      label: 'Value type',
      propGroup: 'value',
      options: ['number', 'text'],
      optional: true,
    }),
    size: props.Enum({
      label: 'Size',
      propGroup: 'display',
      options: ['small', 'medium', 'large'],
      optional: true,
    }),
    valueSize: props.Enum({
      label: 'Value size',
      propGroup: 'value',
      options: ['xs', 's', 'm', 'l', 'xl'],
      optional: true,
    }),
    enhanced: props.DynamicProperty({
      label: 'Enhanced (default false)',
      propGroup: 'display',
      valueType: 'Boolean',
      optional: true,
    }),
    weight: props.Enum({
      label: 'Weight',
      propGroup: 'display',
      options: ['regular', 'semibold', 'bold'],
      optional: true,
    }),
    hasDegree: props.DynamicProperty({
      label: 'Has degree (default false)',
      propGroup: 'display',
      valueType: 'Boolean',
      optional: true,
    }),
    hasIcon: props.DynamicProperty({
      label: 'Has icon (default false)',
      propGroup: 'display',
      valueType: 'Boolean',
      optional: true,
    }),
    fractionDigits: props.DynamicProperty({
      label: 'Fraction digits (default 0)',
      propGroup: 'display',
      valueType: 'NumericValue',
      optional: true,
    }),
    maxDigits: props.DynamicProperty({
      label: 'Max digits (default 0)',
      propGroup: 'display',
      valueType: 'NumericValue',
      optional: true,
    }),
    hintedZeros: props.DynamicProperty({
      label: 'Hinted zeros (default false)',
      propGroup: 'display',
      valueType: 'Boolean',
      optional: true,
    }),
    hasSignSpacer: props.DynamicProperty({
      label: 'Has sign spacer (default false)',
      propGroup: 'display',
      valueType: 'Boolean',
      optional: true,
    }),
    spaceReserver: props.DynamicProperty({
      label: 'Space reserver',
      propGroup: 'display',
      valueType: 'String',
      optional: true,
    }),
    off: props.DynamicProperty({
      label: 'Off (default false)',
      propGroup: 'display',
      valueType: 'Boolean',
      optional: true,
    }),
    offText: props.DynamicProperty({
      label: 'Off text (default OFF)',
      propGroup: 'display',
      valueType: 'String',
      optional: true,
    }),
    alignment: props.Enum({
      label: 'Alignment',
      propGroup: 'display',
      options: ['left', 'center', 'right'],
      optional: true,
    }),
    category: props.Enum({
      label: 'Category',
      propGroup: 'display',
      options: ['regular', 'optimal', 'eco', 'caution', 'warning', 'alarm', 'running'],
      optional: true,
    }),
    active: props.DynamicProperty({
      label: 'Active (default false)',
      propGroup: 'display',
      valueType: 'Boolean',
      optional: true,
    }),
    dataQuality: props.Enum({
      label: 'Data quality',
      propGroup: 'display',
      options: ['low-integrity', 'invalid'],
      optional: true,
    }),
    alert: props.DynamicProperty({
      label: 'Alert (JSON)',
      propGroup: 'display',
      valueType: '*',
      optional: true,
    }),
    hidePhase: props.Enum({
      label: 'Hide phase',
      propGroup: 'display',
      options: ['none', 'hiding', 'hidden'],
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

    const valueDp = useDynamicProperty(p.value);
    const enhancedDp = useDynamicProperty(p.enhanced, { valueType: values.Boolean() });
    const hasDegreeDp = useDynamicProperty(p.hasDegree, { valueType: values.Boolean() });
    const hasIconDp = useDynamicProperty(p.hasIcon, { valueType: values.Boolean() });
    const fractionDigitsDp = useDynamicProperty(p.fractionDigits, { valueType: values.Number() });
    const maxDigitsDp = useDynamicProperty(p.maxDigits, { valueType: values.Number() });
    const hintedZerosDp = useDynamicProperty(p.hintedZeros, { valueType: values.Boolean() });
    const hasSignSpacerDp = useDynamicProperty(p.hasSignSpacer, { valueType: values.Boolean() });
    const spaceReserverDp = useDynamicProperty(p.spaceReserver, { valueType: values.String() });
    const offDp = useDynamicProperty(p.off, { valueType: values.Boolean() });
    const offTextDp = useDynamicProperty(p.offText, { valueType: values.String() });
    const activeDp = useDynamicProperty(p.active, { valueType: values.Boolean() });
    const alertDp = useDynamicProperty(p.alert);

    const onClick = useAction(p.onClick);

    // Dynamic properties need to be mounted to subscribe to value changes.
    const subscriptions = [
      valueDp,
      enhancedDp,
      hasDegreeDp,
      hasIconDp,
      fractionDigitsDp,
      maxDigitsDp,
      hintedZerosDp,
      hasSignSpacerDp,
      spaceReserverDp,
      offDp,
      offTextDp,
      activeDp,
      alertDp,
    ];

    const clickable = onClick.canCall === true && interactive;

    return (
      <Fragment>
        {subscriptions.map((dp, index) => (
          <Fragment key={index}>{dp.render()}</Fragment>
        ))}
        {onClick.render()}

        <ReadoutBlock
          variant={p.variant as ReadoutBlockProps['variant']}
          value={optionalPrimitive(p.value, valueDp) as ReadoutBlockProps['value']}
          valueType={p.valueType as ReadoutBlockProps['valueType']}
          size={p.size as ReadoutBlockProps['size']}
          valueSize={p.valueSize as ReadoutBlockProps['valueSize']}
          enhanced={optionalBoolean(p.enhanced, enhancedDp) ?? false}
          weight={p.weight as ReadoutBlockProps['weight']}
          hasDegree={optionalBoolean(p.hasDegree, hasDegreeDp) ?? false}
          hasIcon={optionalBoolean(p.hasIcon, hasIconDp) ?? false}
          fractionDigits={optionalNumber(p.fractionDigits, fractionDigitsDp) ?? 0}
          maxDigits={optionalNumber(p.maxDigits, maxDigitsDp) ?? 0}
          hintedZeros={optionalBoolean(p.hintedZeros, hintedZerosDp) ?? false}
          hasSignSpacer={optionalBoolean(p.hasSignSpacer, hasSignSpacerDp) ?? false}
          spaceReserver={optionalString(p.spaceReserver, spaceReserverDp)}
          off={optionalBoolean(p.off, offDp) ?? false}
          offText={optionalString(p.offText, offTextDp) ?? 'OFF'}
          alignment={p.alignment as ReadoutBlockProps['alignment']}
          category={p.category as ReadoutBlockProps['category']}
          active={optionalBoolean(p.active, activeDp) ?? false}
          dataQuality={p.dataQuality as ReadoutBlockProps['dataQuality']}
          alert={optionalJson(p.alert, alertDp) as ReadoutBlockProps['alert']}
          hidePhase={p.hidePhase as ReadoutBlockProps['hidePhase']}
          onClick={clickable ? onClick.call : undefined}
        />
      </Fragment>
    );
  },
});
