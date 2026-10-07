import type { ObcReadoutBlock as ObcReadoutBlockElement } from '@oicl/openbridge-webcomponents/dist/building-blocks/readout-block/readout-block.js';
import { ObcReadoutBlock } from '@oicl/openbridge-webcomponents-react/building-blocks/readout-block/readout-block.js';
import { className, cx } from '@hmiproject/helio-sdk';
import { definedProps } from '../../utils/valueMapping';

export type ReadoutBlockProps = Partial<
  Pick<
    ObcReadoutBlockElement,
    | 'variant'
    | 'value'
    | 'valueType'
    | 'size'
    | 'valueSize'
    | 'enhanced'
    | 'weight'
    | 'hasDegree'
    | 'hasIcon'
    | 'fractionDigits'
    | 'maxDigits'
    | 'hintedZeros'
    | 'hasSignSpacer'
    | 'spaceReserver'
    | 'off'
    | 'offText'
    | 'alignment'
    | 'category'
    | 'active'
    | 'dataQuality'
    | 'alert'
    | 'hidePhase'
  >
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

export function ReadoutBlock({ onClick, ...props }: ReadoutBlockProps) {
  return (
    <div className={cx(classNames.root, onClick && classNames.clickable)}>
      <ObcReadoutBlock onClick={onClick} {...definedProps(props)} />
    </div>
  );
}
