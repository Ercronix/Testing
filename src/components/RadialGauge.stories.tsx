import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadialGauge, type RadialGaugeProps } from './RadialGauge';

const meta = {
  title: 'OpenBridge/Radial Gauge',
  component: RadialGauge,
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
    state: { control: 'select', options: ['active', 'loading', 'off'] },
    priority: { control: 'select', options: ['regular', 'enhanced'] },
    type: { control: 'select', options: ['filled', 'bar', 'needle'] },
    tickmarkStyle: { control: 'select', options: ['regular', 'enhanced'] },
    sector: { control: 'select', options: ['270', '180', '90-left', '90-right'] },
    horizontalAlignment: { control: 'select', options: ['left', 'center', 'right'] },
    verticalAlignment: { control: 'select', options: ['top', 'center', 'bottom'] },
    value: { control: 'number' },
  },
  args: {
    state: 'active' as RadialGaugeProps['state'],
    value: 42,
  } satisfies RadialGaugeProps,
} satisfies Meta<typeof RadialGauge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WideContainer: Story = {
  parameters: { size: { width: 640, height: 240 } },
};

export const Loading: Story = {
  args: { state: 'loading' as RadialGaugeProps['state'] },
};
