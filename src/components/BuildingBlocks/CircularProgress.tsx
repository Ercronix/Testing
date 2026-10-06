import type { ObcCircularProgress as ObcCircularProgressElement } from '@oicl/openbridge-webcomponents/dist/building-blocks/circular-progress/circular-progress.js';
import { ObcCircularProgress } from '@oicl/openbridge-webcomponents-react/building-blocks/circular-progress/circular-progress.js';
import { className, cx } from '@hmiproject/helio-sdk';
import { AutoSizer } from '../../utils/AutoSizer';
import { definedProps } from '../../utils/valueMapping';

export type CircularProgressProps = Partial<
  Pick<ObcCircularProgressElement, 'mode' | 'value' | 'strokeWidth' | 'viewBoxSize' | 'padding'>
> & { onClick?: () => void };

const classNames = {
  root: className({
    minHeight: 120,
    fontFamily: "'Noto Sans', sans-serif",
  }),
  clickable: className({ cursor: 'pointer' }),
};

export function CircularProgress({ onClick, ...props }: CircularProgressProps) {
  return (
    <AutoSizer className={cx(classNames.root, onClick && classNames.clickable)}>
      {({ width, height }) => {
        const size = Math.min(width, height);
        return (
          <ObcCircularProgress
            style={{ display: 'block', position: 'relative', width: size, height: size }}
            onClick={onClick}
            {...definedProps(props)}
          />
        );
      }}
    </AutoSizer>
  );
}
