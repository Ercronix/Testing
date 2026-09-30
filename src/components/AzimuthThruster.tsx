import type { LinearAdvice } from '@oicl/openbridge-webcomponents/dist/navigation-instruments/thruster/advice.js';
import { PropellerType } from '@oicl/openbridge-webcomponents/dist/navigation-instruments/thruster/propeller.js';
import {
  InstrumentState,
  Priority,
} from '@oicl/openbridge-webcomponents/dist/navigation-instruments/types.js';
import type { AngleAdvice } from '@oicl/openbridge-webcomponents/dist/navigation-instruments/watch/advice.js';
import { TickmarkStyle } from '@oicl/openbridge-webcomponents/dist/navigation-instruments/watch/tickmark.js';
import { ObcAzimuthThruster } from '@oicl/openbridge-webcomponents-react/navigation-instruments/azimuth-thruster/azimuth-thruster.js';
import { className, cx } from '@hmiproject/helio-sdk';
import { AutoSizer } from '../utils/AutoSizer';

export type AzimuthThrusterProps = {
  state: InstrumentState;
  priority: Priority;

  /** Thruster direction in degrees (0 = ahead). */
  angle: number;
  /** Thrust in percent, -100 … +100. */
  thrust: number;

  angleSetpoint: number | undefined;
  atAngleSetpoint: boolean;
  autoAtAngleSetpoint: boolean;
  autoAtAngleSetpointDeadband: number;
  angleSetpointOverride: boolean;

  thrustSetpoint: number | undefined;
  atThrustSetpoint: boolean;
  autoAtThrustSetpoint: boolean;
  autoAtThrustSetpointDeadband: number;
  thrustSetpointOverride: boolean;

  animateSetpoint: boolean;
  angleAdvices: AngleAdvice[];
  thrustAdvices: LinearAdvice[];

  showLabels: boolean;
  tickmarksInside: boolean;
  tickmarkStyle: TickmarkStyle;
  primaryTickmarkInterval: number | undefined;
  secondaryTickmarkInterval: number | undefined;
  tertiaryTickmarkInterval: number | undefined;

  topPropeller: PropellerType;
  bottomPropeller: PropellerType;
  singleDirection: boolean;
  starboardPortIndicator: boolean;

  onClick?: () => void;
};

const classNames = {
  root: className({
    minHeight: 120,
    fontFamily: "'Noto Sans', sans-serif",
  }),
  clickable: className({ cursor: 'pointer' }),
};

/**
 * Presentational wrapper around OpenBridge's `<obc-azimuth-thruster>`.
 * Receives fully resolved values; all HELIO dynamic property handling happens
 * in the element. The instrument is kept square and scaled to the largest size
 * that fits.
 */
export function AzimuthThruster({ onClick, ...props }: AzimuthThrusterProps) {
  return (
    <AutoSizer className={cx(classNames.root, onClick && classNames.clickable)}>
      {({ width, height }) => {
        const size = Math.min(width, height);
        return (
          <ObcAzimuthThruster
            style={{ display: 'block', width: size, height: size }}
            onClick={onClick}
            state={props.state}
            priority={props.priority}
            angle={props.angle}
            thrust={props.thrust}
            angleSetpoint={props.angleSetpoint}
            atAngleSetpoint={props.atAngleSetpoint}
            autoAtAngleSetpoint={props.autoAtAngleSetpoint}
            autoAtAngleSetpointDeadband={props.autoAtAngleSetpointDeadband}
            angleSetpointOverride={props.angleSetpointOverride}
            thrustSetpoint={props.thrustSetpoint}
            atThrustSetpoint={props.atThrustSetpoint}
            autoAtThrustSetpoint={props.autoAtThrustSetpoint}
            autoAtThrustSetpointDeadband={props.autoAtThrustSetpointDeadband}
            thrustSetpointOverride={props.thrustSetpointOverride}
            animateSetpoint={props.animateSetpoint}
            angleAdvices={props.angleAdvices}
            thrustAdvices={props.thrustAdvices}
            showLabels={props.showLabels}
            tickmarksInside={props.tickmarksInside}
            tickmarkStyle={props.tickmarkStyle}
            primaryTickmarkInterval={props.primaryTickmarkInterval}
            secondaryTickmarkInterval={props.secondaryTickmarkInterval}
            tertiaryTickmarkInterval={props.tertiaryTickmarkInterval}
            topPropeller={props.topPropeller}
            bottomPropeller={props.bottomPropeller}
            singleDirection={props.singleDirection}
            starboardPortIndicator={props.starboardPortIndicator}
          />
        );
      }}
    </AutoSizer>
  );
}

export { InstrumentState, Priority, PropellerType, TickmarkStyle };
