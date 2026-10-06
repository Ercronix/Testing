import type { ObcWatch as ObcWatchElement } from '@oicl/openbridge-webcomponents/dist/navigation-instruments/watch/watch.js';
import { ObcWatch } from '@oicl/openbridge-webcomponents-react/navigation-instruments/watch/watch.js';
import { className, cx } from '@hmiproject/helio-sdk';
import { AutoSizer } from '../../utils/AutoSizer';
import { definedProps } from '../../utils/valueMapping';

export type WatchProps = Partial<
  Pick<
    ObcWatchElement,
    | 'state'
    | 'priority'
    | 'watchCircleType'
    | 'hasBackgroundCircle'
    | 'northArrow'
    | 'northArrowInside'
    | 'northMarker'
    | 'angleSetpoint'
    | 'atAngleSetpoint'
    | 'angleSetpointAtZeroDeadband'
    | 'setpointOverride'
    | 'animateSetpoint'
    | 'padding'
    | 'areas'
    | 'barAreas'
    | 'roundBandCuts'
    | 'splitBand'
    | 'needles'
    | 'tickmarks'
    | 'tickmarksInside'
    | 'tickmarkStyle'
    | 'advices'
    | 'crosshairEnabled'
    | 'crosshairCenterCutout'
    | 'showLabels'
    | 'insideLabelsFlush'
    | 'vessels'
    | 'windKnots'
    | 'windFromDirectionDeg'
    | 'windSymbolRadius'
    | 'windColor'
    | 'current'
    | 'currentFromDirectionDeg'
    | 'currentSymbolRadius'
    | 'currentColor'
    | 'currentIconCentered'
    | 'scaleCurrentIcon'
    | 'starboardPortIndicator'
    | 'clipTop'
    | 'clipBottom'
    | 'clipLeft'
    | 'clipRight'
    | 'endLabelsMaxMin'
    | 'scaleWindIcon'
    | 'rotation'
    | 'zoomToFitArc'
    | 'arcFrame'
    | 'tickFadeAngle'
    | 'rotType'
    | 'rotPosition'
    | 'rotStartAngle'
    | 'rotEndAngle'
    | 'rotPriority'
    | 'rotPortStarboard'
    | 'rotAtZeroDeadband'
    | 'rateOfTurnDegreesPerMinute'
    | 'rotDotAnimationFactor'
  >
> & { onClick?: () => void };

const classNames = {
  root: className({
    minHeight: 120,
    fontFamily: "'Noto Sans', sans-serif",
  }),
  clickable: className({ cursor: 'pointer' }),
};

export function Watch({ onClick, ...props }: WatchProps) {
  return (
    <AutoSizer className={cx(classNames.root, onClick && classNames.clickable)}>
      {({ width, height }) => {
        const size = Math.min(width, height);
        return (
          <ObcWatch
            style={{ display: 'block', width: size, height: size }}
            onClick={onClick}
            {...definedProps(props)}
          />
        );
      }}
    </AutoSizer>
  );
}
