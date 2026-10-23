import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { openBridgeIcons } from './openbridgeIcons';
import { OPENBRIDGE_ICON_CATEGORIES } from './openbridgeIcons.generated';

type GalleryProps = {
  /** Icon color; the SVGs use `currentColor`. */
  color: string;
  /** Rendered size in px. */
  size: number;
};

/** All registered OpenBridge icons as HELIO shows them in its icon selector. */
function IconGallery({ color, size }: GalleryProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const needle = query.trim().toLowerCase();
  const icons = openBridgeIcons.filter(
    (icon) =>
      (!category || icon.category === category) &&
      (!needle || `${icon.name} ${icon.description}`.toLowerCase().includes(needle)),
  );

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          placeholder="Search name or obi-tag…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {OPENBRIDGE_ICON_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <span>
          {icons.length} / {openBridgeIcons.length}
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: 12,
          color,
        }}
      >
        {icons.map((icon) => (
          <div key={icon.name} title={`${icon.description}\n${icon.category}`}>
            <icon.Icon size="M" width={size} height={size} />
            <div style={{ fontSize: 11, color: '#555', overflowWrap: 'anywhere' }}>{icon.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const meta = {
  title: 'OpenBridge/Icons',
  component: IconGallery,
  args: { color: '#1f2a37', size: 32 },
  argTypes: { color: { control: 'color' } },
} satisfies Meta<typeof IconGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Gallery: Story = {};
