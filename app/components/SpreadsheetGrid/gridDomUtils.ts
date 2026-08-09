export function getActiveCellFromDom(): { rowIdx: number; colIdx: number } | null {
  const el = document.activeElement;
  if (!(el instanceof HTMLElement)) return null;
  if (!el.matches("[data-row][data-col]")) return null;
  const rowIdx = Number(el.dataset.row);
  const colIdx = Number(el.dataset.col);
  if (!Number.isInteger(rowIdx) || !Number.isInteger(colIdx)) return null;
  if (rowIdx < 0 || colIdx < 0) return null;
  return { rowIdx, colIdx };
}

function queryCell(rowIdx: number, colIdx: number): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    `[data-row="${rowIdx}"][data-col="${colIdx}"]`
  );
}

/**
 * Scroll the (virtualized-away) target row into view so it gets mounted, then
 * focus it once React has committed the new window. Used when the cell we want
 * to focus isn't currently in the DOM because row virtualization has unmounted
 * it.
 */
function scrollRowIntoView(rowIdx: number): void {
  const scroller = document.querySelector<HTMLElement>("[data-grid-scroller]");
  if (!scroller) return;

  const sample = scroller.querySelector<HTMLElement>("tbody [data-row]");
  if (!sample) return;
  const sampleIdx = Number(sample.dataset.row);
  if (!Number.isInteger(sampleIdx)) return;

  const scrollerRect = scroller.getBoundingClientRect();
  const sampleRect = sample.getBoundingClientRect();
  const rowHeight = sampleRect.height || 26;
  const headerHeight =
    scroller.querySelector<HTMLElement>("thead")?.getBoundingClientRect()
      .height ?? 0;

  // Content-space top of the sample row, then extrapolate to the target row.
  const sampleTop = sampleRect.top - scrollerRect.top + scroller.scrollTop;
  const targetTop = sampleTop + (rowIdx - sampleIdx) * rowHeight;

  const viewTop = scroller.scrollTop;
  const viewBottom = viewTop + scroller.clientHeight;

  if (targetTop < viewTop + headerHeight) {
    // Target is above the fold (or hidden under the sticky header).
    scroller.scrollTop = Math.max(0, targetTop - headerHeight);
  } else if (targetTop + rowHeight > viewBottom) {
    // Target is below the fold.
    scroller.scrollTop = targetTop + rowHeight - scroller.clientHeight;
  }
}

export function focusCellAt(rowIdx: number, colIdx: number): void {
  const existing = queryCell(rowIdx, colIdx);
  if (existing) {
    existing.focus({ preventScroll: true });
    existing.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    return;
  }

  // The cell is virtualized away — bring its row into view, then focus it once
  // the virtualizer has re-rendered the newly visible window.
  scrollRowIntoView(rowIdx);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const el = queryCell(rowIdx, colIdx);
      if (!el) return;
      el.focus({ preventScroll: true });
      el.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    });
  });
}
