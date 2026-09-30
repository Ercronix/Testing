import { className, cx } from '@hmiproject/helio-sdk';
import { useEffect, useRef, useState, type ReactNode } from 'react';

export type Size = { width: number; height: number };

type AutoSizerProps = {
  className?: string;
  children: (size: Size) => ReactNode;
};

const classNames = {
  root: className({
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  }),
};

/**
 * Fills its parent, measures the available space and renders its children
 * with that size. Children are centered and only rendered once the size is
 * known (both dimensions > 0).
 */
export function AutoSizer({ className, children }: AutoSizerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((previous) =>
        previous.width === width && previous.height === height ? previous : { width, height },
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cx(classNames.root, className)}>
      {size.width > 0 && size.height > 0 && children(size)}
    </div>
  );
}
