import {
  CogArrowStyle,
  CompassDirection,
  HdgArrowStyle,
  type CompassCenterReadout,
  type CompassPriorityElement,
} from '@oicl/openbridge-webcomponents/dist/navigation-instruments/compass/compass.js';
import {
  RotPosition,
  RotType,
} from '@oicl/openbridge-webcomponents/dist/navigation-instruments/rate-of-turn/rot-renderer.js';
import {
  InstrumentState,
  Priority,
} from '@oicl/openbridge-webcomponents/dist/navigation-instruments/types.js';
import type { AngleAdvice } from '@oicl/openbridge-webcomponents/dist/navigation-instruments/watch/advice.js';
import { VesselImage } from '@oicl/openbridge-webcomponents/dist/navigation-instruments/watch/vessel.js';
import { ObcCompass } from '@oicl/openbridge-webcomponents-react/navigation-instruments/compass/compass.js';
import { className, cx } from '@hmiproject/helio-sdk';
import { useEffect, useRef, useState, type ReactNode } from 'react';

export type CompassProps = {
  state: InstrumentState;
  direction: CompassDirection;

  heading: number;
  courseOverGround: number | undefined;
  rateOfTurnDegreesPerMinute: number | undefined;

  headingSetpoint: number | undefined;
  atHeadingSetpoint: boolean;
  autoAtHeadingSetpoint: boolean;
  autoAtHeadingSetpointDeadband: number;
  headingSetpointOverride: boolean;
  animateSetpoint: boolean;
  headingAdvices: AngleAdvice[];

  windSpeedKnots: number | undefined;
  windFromDirection: number | undefined;
  currentSpeed: number | undefined;
  currentFromDirection: number | undefined;

  priority: Priority;
  priorityElements: CompassPriorityElement[];
  showLabels: boolean;
  tickmarksInside: boolean;

  hdgArrowStyle: HdgArrowStyle;
  cogArrowStyle: CogArrowStyle;
  vesselImage: VesselImage;
  centerReadouts: CompassCenterReadout[];

  rotType: RotType;
  rotPosition: RotPosition;
  rotMaxValue: number;
  rotDotAnimationFactor: number;

  onClick?: () => void;
};

const classNames = {
  autoSizer: className({
    width: '100%',
    height: '100%',
    minHeight: 120,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    fontFamily: "'Noto Sans', sans-serif",
  }),
  clickable: className({ cursor: 'pointer' }),
};

type Size = { width: number; height: number };

/** Measures the space it is given and renders its children with that size. */
function AutoSizer({
  className,
  children,
}: {
  className?: string;
  children: (size: Size) => ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((previous) =>
        previous.width === width && previous.height === height ? previous : { width, height },
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cx(classNames.autoSizer, className)}>
      {size.width > 0 && size.height > 0 && children(size)}
    </div>
  );
}

/**
 * Presentational wrapper around OpenBridge's `<obc-compass>`. Receives fully
 * resolved values; all HELIO dynamic property handling happens in the element.
 * The compass is kept square and scaled to the largest size that fits.
 */
export function Compass({ onClick, ...props }: CompassProps) {
  // The COG arrow is only drawn when we actually have a course; otherwise it
  // follows the heading so it stays hidden underneath the HDG arrow.
  const courseOverGround = props.courseOverGround ?? props.heading;
  const hasWind = props.windSpeedKnots !== undefined && props.windFromDirection !== undefined;
  const hasCurrent = props.currentSpeed !== undefined && props.currentFromDirection !== undefined;

  return (
    <AutoSizer className={onClick ? classNames.clickable : undefined}>
      {({ width, height }) => {
        const size = Math.min(width, height);
        return (
          <ObcCompass
            style={{ display: 'block', width: size, height: size }}
            onClick={onClick}
            state={props.state}
            direction={props.direction}
            heading={props.heading}
            courseOverGround={courseOverGround}
            rateOfTurnDegreesPerMinute={props.rateOfTurnDegreesPerMinute ?? 0}
            headingSetpoint={props.headingSetpoint ?? null}
            atHeadingSetpoint={props.atHeadingSetpoint}
            autoAtHeadingSetpoint={props.autoAtHeadingSetpoint}
            autoAtHeadingSetpointDeadband={props.autoAtHeadingSetpointDeadband}
            headingSetpointOverride={props.headingSetpointOverride}
            animateSetpoint={props.animateSetpoint}
            headingAdvices={props.headingAdvices}
            currentWindSpeedKnots={hasWind ? props.windSpeedKnots! : null}
            windFromDirection={hasWind ? props.windFromDirection! : null}
            currentSpeed={hasCurrent ? props.currentSpeed! : null}
            currentFromDirection={hasCurrent ? props.currentFromDirection! : null}
            priority={props.priority}
            priorityElements={props.priorityElements}
            showLabels={props.showLabels}
            tickmarksInside={props.tickmarksInside}
            hdgArrowStyle={props.hdgArrowStyle}
            cogArrowStyle={props.cogArrowStyle}
            vesselImage={props.vesselImage}
            centerReadouts={props.centerReadouts}
            rotType={props.rotType}
            rotPosition={props.rotPosition}
            rotMaxValue={props.rotMaxValue}
            rotDotAnimationFactor={props.rotDotAnimationFactor}
          />
        );
      }}
    </AutoSizer>
  );
}

export {
  CogArrowStyle,
  CompassDirection,
  HdgArrowStyle,
  InstrumentState,
  Priority,
  RotPosition,
  RotType,
  VesselImage,
};
