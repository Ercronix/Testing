import type { ObcWatchFlat as ObcWatchFlatElement } from '@oicl/openbridge-webcomponents/dist/navigation-instruments/watch-flat/watch-flat.js';
import { ObcWatchFlat } from '@oicl/openbridge-webcomponents-react/navigation-instruments/watch-flat/watch-flat.js';
import { className, cx } from '@hmiproject/helio-sdk';
import { AutoSizer } from '../../utils/AutoSizer';
import { definedProps } from '../../utils/valueMapping';

export type WatchFlatProps = Partial<
  Pick<
    ObcWatchFlatElement,
    | 'padding'
    | 'rotation'
    | 'tickmarkSpacing'
    | 'angleSetpoint'
    | 'tickmarks'
    | 'labels'
    | 'borderRadius'
    | 'bottomBar'
    | 'barAreas'
    | 'needles'
    | 'rotType'
    | 'rotPosition'
    | 'rotStartX'
    | 'rotEndX'
    | 'rotDotSpacing'
    | 'rotPriority'
    | 'rotPortStarboard'
    | 'rotAtZeroDeadband'
    | 'rateOfTurnDegreesPerMinute'
    | 'rotDotAnimationFactor'
  >
> & { onClick?: () => void };

const classNames = {
  root: className({
    minHeight: 48,
    fontFamily: "'Noto Sans', sans-serif",
  }),
  clickable: className({ cursor: 'pointer' }),
};

export function WatchFlat({ onClick, ...props }: WatchFlatProps) {
  return (
    <AutoSizer className={cx(classNames.root, onClick && classNames.clickable)}>
      {({ width, height }) => {
        return (
          <ObcWatchFlat
            style={{ display: 'block', width, height }}
            onClick={onClick}
            width={width}
            height={height}
            {...definedProps(props)}
          />
        );
      }}
    </AutoSizer>
  );
}
