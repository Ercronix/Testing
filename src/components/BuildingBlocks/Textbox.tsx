import type { ObcTextbox as ObcTextboxElement } from '@oicl/openbridge-webcomponents/dist/components/textbox/textbox.js';
import { ObcTextbox } from '@oicl/openbridge-webcomponents-react/components/textbox/textbox.js';
import { className, cx } from '@hmiproject/helio-sdk';
import { definedProps } from '../../utils/valueMapping';

export type TextboxProps = Partial<
  Pick<ObcTextboxElement, 'alignment' | 'size' | 'fontWeight' | 'tabularNums'>
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

export function Textbox({ onClick, ...props }: TextboxProps) {
  return (
    <div className={cx(classNames.root, onClick && classNames.clickable)}>
      <ObcTextbox onClick={onClick} {...definedProps(props)} />
    </div>
  );
}
