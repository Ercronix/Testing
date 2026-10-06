import type { ObcInstrumentRadial as ObcInstrumentRadialElement } from '@oicl/openbridge-webcomponents/dist/building-blocks/instrument-radial/instrument-radial.js';
import { ObcInstrumentRadial } from '@oicl/openbridge-webcomponents-react/building-blocks/instrument-radial/instrument-radial.js';
import { className, cx } from '@hmiproject/helio-sdk';
import type { ComponentProps } from 'react';
import { AutoSizer } from '../../utils/AutoSizer';
import { definedProps } from '../../utils/valueMapping';

export type InstrumentRadialProps = Partial<
  Pick<
    ObcInstrumentRadialElement,
    | 'state'
    | 'priority'
    | 'value'
    | 'maxValue'
    | 'minValue'
    | 'needleColor'
    | 'barColor'
    | 'showLabels'
    | 'primaryTickmarkInterval'
    | 'secondaryTickmarkInterval'
    | 'tertiaryTickmarkInterval'
    | 'type'
    | 'needleType'
    | 'tickmarksInside'
    | 'tickmarkStyle'
    | 'advices'
    | 'clipTop'
    | 'clipBottom'
    | 'clipLeft'
    | 'clipRight'
    | 'endLabelsMaxMin'
    | 'zoomToFitArc'
    | 'setpoint'
    | 'atSetpoint'
    | 'autoAtSetpoint'
    | 'autoAtSetpointDeadband'
    | 'setpointAtZeroDeadband'
    | 'setpointOverride'
    | 'animateSetpoint'
  >
> &
  Partial<Pick<ComponentProps<typeof ObcInstrumentRadial>, 'onFrameChanged'>> & {
    onClick?: () => void;
  };

const classNames = {
  root: className({
    minHeight: 120,
    fontFamily: "'Noto Sans', sans-serif",
  }),
  clickable: className({ cursor: 'pointer' }),
};

export function InstrumentRadial({ onClick, ...props }: InstrumentRadialProps) {
  return (
    <AutoSizer className={cx(classNames.root, onClick && classNames.clickable)}>
      {({ width, height }) => {
        const size = Math.min(width, height);
        return (
          <ObcInstrumentRadial
            style={{ display: 'block', width: size, height: size }}
            onClick={onClick}
            {...definedProps(props)}
          />
        );
      }}
    </AutoSizer>
  );
}
