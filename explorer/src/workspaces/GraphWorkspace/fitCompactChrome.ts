import { useLayoutEffect, type RefObject } from "react";

export const COMPACT_CHIP_FONT_MAX_PX = 12;
export const COMPACT_CHIP_FONT_MIN_PX = 7;

export function fitFontSizeToWidth(
  minSize: number,
  maxSize: number,
  overflows: (size: number) => boolean,
): number {
  if (!overflows(maxSize)) {
    return maxSize;
  }
  if (overflows(minSize)) {
    return minSize;
  }
  let lo = minSize;
  let hi = maxSize;
  let best = minSize;
  for (let i = 0; i < 12; i += 1) {
    const mid = (lo + hi) / 2;
    if (overflows(mid)) {
      hi = mid;
    } else {
      best = mid;
      lo = mid;
    }
  }
  return Math.round(best * 10) / 10;
}

export function useFitCompactChromeText(
  rowRef: RefObject<HTMLElement | null>,
  contentKey: string,
) {
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) {
      return;
    }

    const apply = (size: number) => {
      row.style.setProperty("--compact-chip-size", `${size}px`);
    };

    const fit = () => {
      const size = fitFontSizeToWidth(
        COMPACT_CHIP_FONT_MIN_PX,
        COMPACT_CHIP_FONT_MAX_PX,
        (candidate) => {
          apply(candidate);
          return row.scrollWidth > row.clientWidth + 1;
        },
      );
      apply(size);
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(row);
    return () => observer.disconnect();
  }, [contentKey, rowRef]);
}
