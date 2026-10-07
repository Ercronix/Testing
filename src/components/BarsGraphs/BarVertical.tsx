import type { ObcBarVertical as ObcBarVerticalElement } from '@oicl/openbridge-webcomponents/dist/building-blocks/bar-vertical/bar-vertical.js';
import { ObcBarVertical } from '@oicl/openbridge-webcomponents-react/building-blocks/bar-vertical/bar-vertical.js';
import { className, cx } from '@hmiproject/helio-sdk';
import type { ComponentProps } from 'react';
import { AutoSizer } from '../../utils/AutoSizer';
import { definedProps } from '../../utils/valueMapping';

export type BarVerticalProps = Partial<
  Pick<
    ObcBarVerticalElement,
    | 'minValue'
    | 'maxValue'
    | 'reverse'
    | 'paddingTop'
    | 'paddingBottom'
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
  Partial<Pick<ComponentProps<typeof ObcBarVertical>, 'onScaleDimensionsChanged'>> & {
    onClick?: () => void;
  };

const classNames = {
  root: className({
    minHeight: 48,
    fontFamily: "'Noto Sans', sans-serif",
  }),
  clickable: className({ cursor: 'pointer' }),
};

export function BarVertical({ onClick, ...props }: BarVerticalProps) {
  return (
    <AutoSizer className={cx(classNames.root, onClick && classNames.clickable)}>
      {({ width, height }) => {
        return (
          <ObcBarVertical
            style={{ display: 'block', width, height }}
            onClick={onClick}
            height={height}
            {...definedProps(props)}
          />
        );
      }}
    </AutoSizer>
  );
}
