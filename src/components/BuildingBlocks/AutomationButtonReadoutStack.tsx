import type { ObcAutomationButtonReadoutStack as ObcAutomationButtonReadoutStackElement } from '@oicl/openbridge-webcomponents/dist/components/automation-button-readout-stack/automation-button-readout-stack.js';
import { ObcAutomationButtonReadoutStack } from '@oicl/openbridge-webcomponents-react/components/automation-button-readout-stack/automation-button-readout-stack.js';
import { className, cx } from '@hmiproject/helio-sdk';
import { definedProps } from '../../utils/valueMapping';

export type AutomationButtonReadoutStackProps = Partial<
  Pick<ObcAutomationButtonReadoutStackElement, 'readouts' | 'tag' | 'size' | 'idTagOrientation'>
> & { onClick?: () => void };

const classNames = {
  root: className({
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Noto Sans', sans-serif",
  }),
  clickable: className({ cursor: 'pointer' }),
};

export function AutomationButtonReadoutStack({
  onClick,
  ...props
}: AutomationButtonReadoutStackProps) {
  return (
    <div className={cx(classNames.root, onClick && classNames.clickable)}>
      <ObcAutomationButtonReadoutStack onClick={onClick} {...definedProps(props)} />
    </div>
  );
}
