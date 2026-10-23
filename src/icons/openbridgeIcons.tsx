import { createIcon, type CreateIconResult, type IconComponentProps } from '@hmiproject/helio-sdk';
import type { SVGProps } from 'react';
import { namespace } from '../namespace';
import {
  OPENBRIDGE_ICON_CATEGORIES,
  OPENBRIDGE_ICONS,
  type OpenBridgeIconData,
} from './openbridgeIcons.generated';

type OpenBridgeIconProps = IconComponentProps & SVGProps<SVGSVGElement>;

/**
 * Turns one generated entry into a HELIO icon. The markup is OpenBridge's
 * `currentColor` variant, so the icon takes the color HELIO renders it with.
 * Like an imported SVG, it keeps its intrinsic size unless HELIO passes one.
 */
export function createOpenBridgeIcon(data: OpenBridgeIconData): CreateIconResult {
  const [id, name, category, width, height, markup] = data;
  const html = { __html: markup };

  // `size` is HELIO's S/M/L hint; OpenBridge has one drawing for all sizes.
  function Icon({ size: _size, children: _children, ...svgProps }: OpenBridgeIconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="currentColor"
        {...svgProps}
        dangerouslySetInnerHTML={html}
      />
    );
  }
  Icon.displayName = `OpenBridgeIcon(${id})`;

  return createIcon(namespace, {
    name,
    description: `obi-${id}`,
    category: OPENBRIDGE_ICON_CATEGORIES[category],
    Icon,
  });
}

export const openBridgeIcons: CreateIconResult[] = OPENBRIDGE_ICONS.map(createOpenBridgeIcon);
