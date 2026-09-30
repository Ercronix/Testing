import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdviceType } from '@oicl/openbridge-webcomponents/dist/navigation-instruments/watch/advice.js';
import { buildCenterReadouts } from '../elements/CompassElement';
import {
  CogArrowStyle,
  Compass,
  CompassDirection,
  HdgArrowStyle,
  InstrumentState,
  Priority,
  RotPosition,
  RotType,
  VesselImage,
} from './Compass';

const meta = {
  title: 'OpenBridge/Compass',
  component: Compass,
  // The container size comes from `parameters.size`, so stories can show how
  // the compass auto-sizes to its container.
  parameters: { size: { width: 420, height: 420 } },
  decorators: [
    (Story, { parameters }) => (
      <div style={{ ...parameters.size, outline: '1px dashed #999' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
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
  },
} satisfies Meta<typeof Compass>;

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

export const WideContainer: Story = {
  parameters: { size: { width: 640, height: 240 } },
};

export const TallContainer: Story = {
  parameters: { size: { width: 200, height: 480 } },
};

export const Loading: Story = {
  args: { state: InstrumentState.loading },
};
