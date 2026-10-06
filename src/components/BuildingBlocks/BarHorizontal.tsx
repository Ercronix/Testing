import type { ObcBarHorizontal as ObcBarHorizontalElement } from '@oicl/openbridge-webcomponents/dist/building-blocks/bar-horizontal/bar-horizontal.js';
import { ObcBarHorizontal } from '@oicl/openbridge-webcomponents-react/building-blocks/bar-horizontal/bar-horizontal.js';
import { className, cx } from '@hmiproject/helio-sdk';
import type { ComponentProps } from 'react';
import { AutoSizer } from '../../utils/AutoSizer';
import { definedProps } from '../../utils/valueMapping';

export type BarHorizontalProps = Partial<
  Pick<
    ObcBarHorizontalElement,
    | 'minValue'
    | 'maxValue'
    | 'reverse'
    | 'paddingLeft'
    | 'paddingRight'
    | 'side'
    | 'fixedAspectRatio'
    | 'scaleReferenceSize'
    | 'hasScale'
    | 'showLabels'
    | 'showMainTickmarkLabels'
    | 'hasBar'
    | 'scaleBackground'
    | 'barContainerStyle'
    | 'barThickness'
    | 'tickThickness'
    | 'labelThickness'
    | 'mainTickmarks'
    | 'primaryTickmarkInterval'
    | 'secondaryTickmarkInterval'
    | 'tertiaryTickmarkInterval'
    | 'scaleType'
    | 'frameStyle'
    | 'borderRadiusPosition'
    | 'instrumentMode'
    | 'borderRadius'
    | 'priority'
    | 'fillMode'
    | 'fillMin'
    | 'fillMax'
    | 'value'
    | 'state'
    | 'advicePosition'
    | 'advices'
    | 'highlightCurrentValue'
    | 'setpoint'
    | 'atSetpoint'
    | 'autoAtSetpoint'
    | 'autoAtSetpointDeadband'
    | 'setpointAtZeroDeadband'
    | 'setpointOverride'
    | 'animateSetpoint'
  >
> &
  Partial<Pick<ComponentProps<typeof ObcBarHorizontal>, 'onScaleDimensionsChanged'>> & {
    onClick?: () => void;
  };

const classNames = {
  root: className({
    minHeight: 48,
    fontFamily: "'Noto Sans', sans-serif",
  }),
  clickable: className({ cursor: 'pointer' }),
};

export function BarHorizontal({ onClick, ...props }: BarHorizontalProps) {
  return (
    <AutoSizer className={cx(classNames.root, onClick && classNames.clickable)}>
      {({ width, height }) => {
        return (
          <ObcBarHorizontal
            style={{ display: 'block', width, height }}
            onClick={onClick}
            width={width}
            {...definedProps(props)}
          />
        );
      }}
    </AutoSizer>
  );
}
