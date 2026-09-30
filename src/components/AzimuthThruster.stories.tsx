import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdviceType } from '@oicl/openbridge-webcomponents/dist/navigation-instruments/watch/advice.js';
import {
  AzimuthThruster,
  InstrumentState,
  Priority,
  PropellerType,
  TickmarkStyle,
} from './AzimuthThruster';

const meta = {
  title: 'OpenBridge/Azimuth Thruster',
  component: AzimuthThruster,
  // The container size comes from `parameters.size`, so stories can show how
  // the instrument auto-sizes to its container.
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
    priority: { control: 'select', options: Object.values(Priority) },
    tickmarkStyle: { control: 'select', options: Object.values(TickmarkStyle) },
    topPropeller: { control: 'select', options: Object.values(PropellerType) },
    bottomPropeller: { control: 'select', options: Object.values(PropellerType) },
    angle: { control: { type: 'range', min: 0, max: 359 } },
    thrust: { control: { type: 'range', min: -100, max: 100 } },
  },
  args: {
    state: InstrumentState.active,
    priority: Priority.regular,
    angle: 30,
    thrust: 60,
    angleSetpoint: 45,
    atAngleSetpoint: false,
    autoAtAngleSetpoint: true,
    autoAtAngleSetpointDeadband: 2,
    angleSetpointOverride: false,
    thrustSetpoint: 70,
    atThrustSetpoint: false,
    autoAtThrustSetpoint: true,
    autoAtThrustSetpointDeadband: 1,
    thrustSetpointOverride: false,
    animateSetpoint: true,
    angleAdvices: [],
    thrustAdvices: [],
    showLabels: true,
    tickmarksInside: false,
    tickmarkStyle: TickmarkStyle.regular,
    primaryTickmarkInterval: 90,
    secondaryTickmarkInterval: undefined,
    tertiaryTickmarkInterval: undefined,
    topPropeller: PropellerType.none,
    bottomPropeller: PropellerType.none,
    singleDirection: false,
    starboardPortIndicator: false,
  },
} satisfies Meta<typeof AzimuthThruster>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FullyLoaded: Story = {
  args: {
    angle: 200,
    thrust: -40,
    angleSetpoint: 190,
    thrustSetpoint: -50,
    angleAdvices: [
      { type: AdviceType.caution, minAngle: 150, maxAngle: 210, hinted: false },
      { type: AdviceType.advice, minAngle: 300, maxAngle: 340, hinted: true },
    ],
    thrustAdvices: [{ type: AdviceType.caution, min: 80, max: 100, hinted: true }],
    priority: Priority.enhanced,
    tickmarkStyle: TickmarkStyle.enhanced,
    secondaryTickmarkInterval: 30,
    tertiaryTickmarkInterval: 10,
    topPropeller: PropellerType.single,
    bottomPropeller: PropellerType.cap,
    starboardPortIndicator: true,
  },
};

export const WideContainer: Story = {
  parameters: { size: { width: 640, height: 240 } },
};

export const Loading: Story = {
  args: { state: InstrumentState.loading },
};
