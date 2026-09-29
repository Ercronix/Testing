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
import { className } from '@hmiproject/helio-sdk';
import { OpenBridgeScope } from '../openbridge/OpenBridgeScope';
import type { ObcTheme } from './compassMapping';

export type CompassViewProps = {
  theme: ObcTheme;
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

  faceDiameter: number | undefined;
  onClick?: () => void;
};

const classNames = {
  root: className({
    width: '100%',
    height: '100%',
    minHeight: 120,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    fontFamily: "'Noto Sans', sans-serif",
  }),
  clickable: className({ cursor: 'pointer' }),
  // Fills a sized container; when the container has no fixed height it stays
  // square instead of collapsing to zero height.
  compass: className({
    display: 'block',
    width: '100%',
    aspectRatio: '1 / 1',
    maxHeight: '100%',
  }),
};

/**
 * Presentational wrapper around OpenBridge's `<obc-compass>`. Receives fully
 * resolved values; all HELIO dynamic property handling happens in the element.
 */
export function CompassView(props: CompassViewProps) {
  // The COG arrow is only drawn when we actually have a course; otherwise it
  // follows the heading so it stays hidden underneath the HDG arrow.
  const courseOverGround = props.courseOverGround ?? props.heading;
  const hasWind = props.windSpeedKnots !== undefined && props.windFromDirection !== undefined;
  const hasCurrent = props.currentSpeed !== undefined && props.currentFromDirection !== undefined;

  return (
    <OpenBridgeScope
      theme={props.theme}
      className={[classNames.root, props.onClick ? classNames.clickable : undefined]
        .filter(Boolean)
        .join(' ')}
    >
      <ObcCompass
        className={props.faceDiameter === undefined ? classNames.compass : undefined}
        onClick={props.onClick}
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
        faceDiameter={props.faceDiameter}
      />
    </OpenBridgeScope>
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
