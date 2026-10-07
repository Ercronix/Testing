import type { Preview } from '@storybook/react-vite';
import '@oicl/openbridge-webcomponents/dist/openbridge.css';
import { OpenBridgeTheme } from '../src/utils/OpenBridgeTheme';

const preview: Preview = {
  // Same HELIO → OpenBridge colours as in the elements (SDK default tokens here).
  decorators: [
    (Story) => (
      <OpenBridgeTheme>
        <Story />
      </OpenBridgeTheme>
    ),
  ],
  parameters: {
    options: {
      storySort: {
        // Sort folders and story titles in ascending order. This does not
        // affect the order of stories within a folder. They are sorted by
        // the order they are defined in the story file.
        method: 'alphabetical',
      },
    },
  },
};

export default preview;
