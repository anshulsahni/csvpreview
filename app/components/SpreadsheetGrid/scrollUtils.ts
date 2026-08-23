export interface ScrollTargetGeometry {
  /** Row index we want to bring into view. */
  targetIdx: number;
  /** Index of a currently-mounted row, used to anchor the extrapolation. */
  sampleIdx: number;
  /** Content-space top (px) of the sample row. */
  sampleTop: number;
  /** Height (px) of a single row. */
  rowHeight: number;
  /** Height (px) of the sticky header overlaying the top of the viewport. */
  headerHeight: number;
  /** Current scroll offset (px) of the scroller. */
  viewTop: number;
  /** Visible height (px) of the scroller. */
  viewportHeight: number;
}

/**
 * Pure scroll-target math. Given where one mounted row sits and how tall rows
 * are, works out where the scroller must move to put `targetIdx` fully in view.
 *
 * Returns `null` when the row is already visible and no scrolling is needed.
 * Rows are assumed uniform in height, which is what the virtualizer assumes too
 * (see `computeRowWindow` in `useRowVirtualizer.ts`).
 */
export function computeScrollTopForRow({
  targetIdx,
  sampleIdx,
  sampleTop,
  rowHeight,
  headerHeight,
  viewTop,
  viewportHeight,
}: ScrollTargetGeometry): number | null {
  // Extrapolate from the sample row to the target row.
  const targetTop = sampleTop + (targetIdx - sampleIdx) * rowHeight;
  const viewBottom = viewTop + viewportHeight;

  if (targetTop < viewTop + headerHeight) {
    // Target is above the fold (or hidden under the sticky header).
    return Math.max(0, targetTop - headerHeight);
  }
  if (targetTop + rowHeight > viewBottom) {
    // Target is below the fold.
    return targetTop + rowHeight - viewportHeight;
  }
  return null;
}
