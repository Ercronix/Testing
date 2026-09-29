import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdviceType } from '@oicl/openbridge-webcomponents/dist/navigation-instruments/watch/advice.js';
import { buildCenterReadouts, OBC_THEMES } from './compassMapping';
import {
  CogArrowStyle,
  CompassDirection,
  CompassView,
  HdgArrowStyle,
  InstrumentState,
  Priority,
  RotPosition,
  RotType,
  VesselImage,
} from './CompassView';

const meta = {
  title: 'OpenBridge/Compass',
  component: CompassView,
  decorators: [
    (Story) => (
      <div style={{ width: 420, height: 420 }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    theme: { control: 'select', options: OBC_THEMES },
    state: { control: 'select', options: Object.values(InstrumentState) },
    direction: { control: 'select', options: Object.values(CompassDirection) },
    priority: { control: 'select', options: Object.values(Priority) },
    hdgArrowStyle: { control: 'select', options: Object.values(HdgArrowStyle) },
    cogArrowStyle: { control: 'select', options: Object.values(CogArrowStyle) },
    vesselImage: { control: 'select', options: Object.values(VesselImage) },
    rotType: { control: 'select', options: Object.values(RotType) },
    rotPosition: { control: 'select', options: Object.values(RotPosition) },
    heading: { control: { type: 'range', min: 0, max: 359 } },
    courseOverGround: { control: { type: 'range', min: 0, max: 359 } },
    rateOfTurnDegreesPerMinute: { control: { type: 'range', min: -60, max: 60 } },
  },
  args: {
    theme: 'day',
    state: InstrumentState.active,
    direction: CompassDirection.NorthUp,
    heading: 45,
    courseOverGround: 52,
    rateOfTurnDegreesPerMinute: 12,
    headingSetpoint: 70,
    atHeadingSetpoint: false,
    autoAtHeadingSetpoint: true,
    autoAtHeadingSetpointDeadband: 2,
    headingSetpointOverride: false,
    animateSetpoint: true,
    headingAdvices: [],
    windSpeedKnots: undefined,
    windFromDirection: undefined,
    currentSpeed: undefined,
    currentFromDirection: undefined,
    priority: Priority.regular,
    priorityElements: [],
    showLabels: true,
    tickmarksInside: false,
    hdgArrowStyle: HdgArrowStyle.arrowHead,
    cogArrowStyle: CogArrowStyle.arrowHead,
    vesselImage: VesselImage.genericTop,
    centerReadouts: [],
    rotType: RotType.dots,
    rotPosition: RotPosition.innerCircle,
    rotMaxValue: 60,
    rotDotAnimationFactor: 18,
    faceDiameter: undefined,
  },
} satisfies Meta<typeof CompassView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FullyLoaded: Story = {
  args: {
    direction: CompassDirection.HeadingUp,
    headingAdvices: [
      { type: AdviceType.caution, minAngle: 100, maxAngle: 140, hinted: false },
      { type: AdviceType.advice, minAngle: 300, maxAngle: 340, hinted: true },
    ],
    windSpeedKnots: 18,
    windFromDirection: 250,
    currentSpeed: 2,
    currentFromDirection: 180,
    priority: Priority.enhanced,
    rotType: RotType.bar,
    centerReadouts: buildCenterReadouts('HDG / COG / ROT', 0),
  },
};

export const Night: Story = {
  args: { theme: 'night' },
  decorators: [
    (Story) => (
      <div style={{ background: '#0a0a0a', padding: 8 }}>
        <Story />
      </div>
    ),
  ],
};

export const Loading: Story = {
  args: { state: InstrumentState.loading },
};
