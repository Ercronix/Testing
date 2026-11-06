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

/** Font size per HELIO icon size – the same as HELIO's built-in `<Icon>`. */
const FONT_SIZES = { S: 16, M: 24, L: 36 } as const;

/**
 * Turns generated icon data into HELIO icons. Like HELIO's built-in icons, the
 * `<svg>` is `1em` square with the font size taken from `size`, so the icon is
 * as big as the built-in ones whatever its `viewBox`; width and height props
 * passed by HELIO still win. The root uses `fill="currentColor"`, so
 * monochrome icons take the color HELIO renders them with.
 */
export function createIconsFromData(
  categories: readonly string[],
  icons: readonly IconData[],
): CreateIconResult[] {
  return icons.map(([name, description, category, width, height, markup]) => {
    const html = { __html: markup };

    function Icon({ size, style, children: _children, ...svgProps }: IconProps) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="1em"
          height="1em"
          viewBox={`0 0 ${width} ${height}`}
          fill="currentColor"
          style={{ fontSize: FONT_SIZES[size] ?? FONT_SIZES.M, ...style }}
          {...svgProps}
          dangerouslySetInnerHTML={html}
        />
      );
    }
    Icon.displayName = `Icon(${name})`;

    return createIcon(namespace, { name, description, category: categories[category], Icon });
  });
}
