import type { Meta, StoryObj } from '@storybook/react-vite';
import { FlatCompass, type FlatCompassProps } from './FlatCompass';

const meta = {
  title: 'OpenBridge/Flat Compass',
  component: FlatCompass,
  // The container size comes from `parameters.size`, so stories can show how
  // the instrument auto-sizes to its container.
  parameters: { size: { width: 640, height: 160 } },
  decorators: [
    (Story, { parameters }) => (
      <div style={{ ...parameters.size, outline: '1px dashed #999' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    priority: { control: 'select', options: ['regular', 'enhanced'] },
    rotType: { control: 'select', options: ['dots', 'bar'] },
    heading: { control: 'number' },
  },
  args: {
    heading: 42,
  } satisfies FlatCompassProps,
} satisfies Meta<typeof FlatCompass>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SmallContainer: Story = {
  parameters: { size: { width: 320, height: 96 } },
};
