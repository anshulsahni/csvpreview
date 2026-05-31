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

export function focusCellAt(rowIdx: number, colIdx: number): void {
  const el = document.querySelector<HTMLElement>(
    `[data-row="${rowIdx}"][data-col="${colIdx}"]`
  );
  if (!el) return;
  el.focus({ preventScroll: true });
  el.scrollIntoView?.({ block: "nearest", inline: "nearest" });
}
