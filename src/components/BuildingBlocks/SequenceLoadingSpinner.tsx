import type { ObcSequenceLoadingSpinner as ObcSequenceLoadingSpinnerElement } from '@oicl/openbridge-webcomponents/dist/components/sequence-loading-spinner/sequence-loading-spinner.js';
import { ObcSequenceLoadingSpinner } from '@oicl/openbridge-webcomponents-react/components/sequence-loading-spinner/sequence-loading-spinner.js';
import { className, cx } from '@hmiproject/helio-sdk';
import { definedProps } from '../../utils/valueMapping';

export type SequenceLoadingSpinnerProps = Partial<
  Pick<
    ObcSequenceLoadingSpinnerElement,
    'type' | 'progression' | 'rotationDurationMs' | 'progressPercent'
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

export function SequenceLoadingSpinner({ onClick, ...props }: SequenceLoadingSpinnerProps) {
  return (
    <div className={cx(classNames.root, onClick && classNames.clickable)}>
      <ObcSequenceLoadingSpinner onClick={onClick} {...definedProps(props)} />
    </div>
  );
}
