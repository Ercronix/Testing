import { createIcon, type CreateIconResult, type IconComponentProps } from '@hmiproject/helio-sdk';
import type { SVGProps } from 'react';
import { namespace } from '../namespace';

/**
 * One icon as written by `scripts/create-icons.mjs`:
 * `[name, description, category index, width, height, inner SVG markup]`.
 */
export type IconData = readonly [
  name: string,
  description: string,
  category: number,
  width: number,
  height: number,
  markup: string,
];

type IconProps = IconComponentProps & SVGProps<SVGSVGElement>;

/**
 * Turns generated icon data into HELIO icons. The `<svg>` root uses
 * `fill="currentColor"`, so monochrome icons take the color HELIO renders them
 * with. Like an imported SVG, an icon keeps its intrinsic size unless HELIO
 * passes one.
 */
export function createIconsFromData(
  categories: readonly string[],
  icons: readonly IconData[],
): CreateIconResult[] {
  return icons.map(([name, description, category, width, height, markup]) => {
    const html = { __html: markup };

    // `size` is HELIO's S/M/L hint; each icon has one drawing for all sizes.
    function Icon({ size: _size, children: _children, ...svgProps }: IconProps) {
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
    Icon.displayName = `Icon(${name})`;

    return createIcon(namespace, { name, description, category: categories[category], Icon });
  });
}
