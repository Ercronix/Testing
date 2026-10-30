import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  CommandMenu,
  commandMenuIcons,
  commandMenuModes,
  type CommandMenuProps,
} from './CommandMenu';

/** Accepts every toggle immediately, like a writable data variable. */
function StatefulCommandMenu(props: CommandMenuProps) {
  const [inCommand, setInCommand] = useState(props.inCommand);
  return (
    <CommandMenu
      {...props}
      inCommand={inCommand}
      onChange={(next) => {
        props.onChange?.(next);
        setInCommand(next);
      }}
    />
  );
}

const meta = {
  title: 'OpenBridge/Command Menu',
  component: CommandMenu,
  parameters: { size: { width: 420, height: 320 } },
  decorators: [
    (Story, { parameters }) => (
      <div style={{ ...parameters.size, outline: '1px dashed #999' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    mode: { control: 'select', options: [...commandMenuModes] },
    icon: { control: 'select', options: [...commandMenuIcons] },
  },
  args: {
    inCommand: false,
    status: 'Joystick',
    description: 'DP',
    location: 'Aft Bridge',
    mode: 'button',
    icon: 'auto',
  } satisfies CommandMenuProps,
  render: (args) => <StatefulCommandMenu key={String(args.inCommand)} {...args} />,
} satisfies Meta<typeof CommandMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Menu: Story = {
  args: { mode: 'menu' },
};

export const InCommand: Story = {
  args: { mode: 'menu', inCommand: true, icon: 'joystick' },
};

export const WithoutLocation: Story = {
  args: { mode: 'menu', location: '' },
};

/** The command state is not written back, so the switch resets after a moment. */
export const ReadOnly: Story = {
  args: { mode: 'menu' },
  render: (args) => <CommandMenu {...args} />,
};
