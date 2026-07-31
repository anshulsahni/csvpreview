"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type RefObject,
} from "react";

/**
 * Fallback row height (px) used before a real row has been measured. Matches the
 * `DataTd` height in `SpreadsheetGrid.tsx` (25px cell + 1px collapsed border).
 */
export const DEFAULT_ROW_HEIGHT = 26;

/** Extra rows rendered above and below the viewport to keep scrolling smooth. */
export const ROW_OVERSCAN = 8;

/**
 * Assumed viewport height (px) for the very first render, before the real
 * scroller has been measured. Keeps the initial mount bounded so opening a huge
 * file never renders every row even once; the layout effect corrects it to the
 * true viewport before paint.
 */
export const INITIAL_VIEWPORT_GUESS = 1200;

export interface RowWindow {
  /** First row index to render (inclusive). */
  startIndex: number;
  /** One past the last row index to render (exclusive). */
  endIndex: number;
  /** Height (px) of the spacer that stands in for rows above the window. */
  topPadHeight: number;
  /** Height (px) of the spacer that stands in for rows below the window. */
  bottomPadHeight: number;
}

/**
 * Pure windowing math. Given the scroll position and viewport height, returns
 * the slice of rows that should be mounted plus the spacer heights that reserve
 * scroll space for the rows that aren't.
 *
 * When there is no measurable viewport (SSR, jsdom, or before first layout) the
 * whole range is returned so nothing is hidden — virtualization only kicks in
 * once the browser can tell us how tall the scroller actually is.
 */
export function computeRowWindow(
  rowCount: number,
  rowHeight: number,
  scrollTop: number,
  viewportHeight: number,
  overscan: number
): RowWindow {
  if (rowCount <= 0) {
    return { startIndex: 0, endIndex: 0, topPadHeight: 0, bottomPadHeight: 0 };
  }
  if (viewportHeight <= 0 || rowHeight <= 0) {
    return {
      startIndex: 0,
      endIndex: rowCount,
      topPadHeight: 0,
      bottomPadHeight: 0,
    };
  }

  const first = Math.floor(scrollTop / rowHeight);
  const visibleCount = Math.ceil(viewportHeight / rowHeight);
  const startIndex = Math.max(0, first - overscan);
  const endIndex = Math.min(rowCount, first + visibleCount + overscan);

  return {
    startIndex,
    endIndex,
    topPadHeight: startIndex * rowHeight,
    bottomPadHeight: Math.max(0, (rowCount - endIndex) * rowHeight),
  };
}

function windowsEqual(a: RowWindow, b: RowWindow): boolean {
  return (
    a.startIndex === b.startIndex &&
    a.endIndex === b.endIndex &&
    a.topPadHeight === b.topPadHeight &&
    a.bottomPadHeight === b.bottomPadHeight
  );
}

export interface UseRowVirtualizerResult {
  rowWindow: RowWindow;
  rowHeight: number;
  /** Attach to the first rendered data row so its height can be measured. */
  measureRef: (el: HTMLElement | null) => void;
}

/**
 * Windows the rows rendered into a scrolling container so large CSV files stay
 * responsive: only the rows near the viewport are mounted, the rest are
 * represented by spacer height above and below.
 */
export function useRowVirtualizer(
  scrollerRef: RefObject<HTMLElement | null>,
  rowCount: number,
  overscan: number = ROW_OVERSCAN
): UseRowVirtualizerResult {
  const [rowHeight, setRowHeight] = useState(DEFAULT_ROW_HEIGHT);
  const [rowWindow, setRowWindow] = useState<RowWindow>(() =>
    computeRowWindow(
      rowCount,
      DEFAULT_ROW_HEIGHT,
      0,
      INITIAL_VIEWPORT_GUESS,
      overscan
    )
  );

  const recompute = useCallback(() => {
    const scroller = scrollerRef.current;
    const viewportHeight = scroller?.clientHeight ?? 0;
    const scrollTop = scroller?.scrollTop ?? 0;
    const next = computeRowWindow(
      rowCount,
      rowHeight,
      scrollTop,
      viewportHeight,
      overscan
    );
    setRowWindow((prev) => (windowsEqual(prev, next) ? prev : next));
  }, [scrollerRef, rowCount, rowHeight, overscan]);

  const measureRef = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const height = el.getBoundingClientRect().height;
    if (height <= 0) return; // unlaid-out (SSR / jsdom): keep the fallback.
    // Ignore sub-pixel jitter so measuring never loops.
    setRowHeight((prev) => (Math.abs(height - prev) > 0.5 ? height : prev));
  }, []);

  // Recompute after every commit (row count, row height, or ref changes) and,
  // via the scroll/resize listeners below, whenever the viewport moves.
  useLayoutEffect(() => {
    recompute();
  }, [recompute]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        recompute();
      });
    };

    scroller.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(schedule);
      observer.observe(scroller);
    }

    return () => {
      if (frame) cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer?.disconnect();
    };
  }, [scrollerRef, recompute]);

  return { rowWindow, rowHeight, measureRef };
}
