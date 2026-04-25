export interface CellSelection {
  anchorRow: number;
  anchorCol: number;
  activeRow: number;
  activeCol: number;
}

export interface SelectionBounds {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

export function colLabel(idx: number): string {
  let label = "";
  let i = idx + 1;
  while (i > 0) {
    label = String.fromCharCode(64 + ((i - 1) % 26) + 1) + label;
    i = Math.floor((i - 1) / 26);
  }
  return label;
}

export function getSelectionBounds(
  selection: CellSelection | null
): SelectionBounds | null {
  if (selection === null) {
    return null;
  }

  return {
    top: Math.min(selection.anchorRow, selection.activeRow),
    left: Math.min(selection.anchorCol, selection.activeCol),
    bottom: Math.max(selection.anchorRow, selection.activeRow),
    right: Math.max(selection.anchorCol, selection.activeCol),
  };
}

export function isCellSelected(
  selection: CellSelection | null,
  rowIdx: number,
  colIdx: number
): boolean {
  const bounds = getSelectionBounds(selection);
  if (bounds === null) {
    return false;
  }

  return (
    rowIdx >= bounds.top &&
    rowIdx <= bounds.bottom &&
    colIdx >= bounds.left &&
    colIdx <= bounds.right
  );
}

export function cellRangeLabel(
  selection: CellSelection | null,
  rowNumberOffset: number
): string | null {
  const bounds = getSelectionBounds(selection);
  if (bounds === null) {
    return null;
  }

  const start = `${colLabel(bounds.left)}${bounds.top + rowNumberOffset}`;
  const end = `${colLabel(bounds.right)}${bounds.bottom + rowNumberOffset}`;
  if (start === end) {
    return start;
  }
  return `${start}:${end}`;
}

function selectedCellCount(selection: CellSelection | null): number {
  const bounds = getSelectionBounds(selection);
  if (bounds === null) {
    return 0;
  }
  return (bounds.bottom - bounds.top + 1) * (bounds.right - bounds.left + 1);
}

export function selectionStatusHint(
  selection: CellSelection | null,
  rowNumberOffset: number
): string | null {
  const count = selectedCellCount(selection);
  const label = cellRangeLabel(selection, rowNumberOffset);
  if (count === 0 || label === null) {
    return null;
  }
  return `${count} cells selected (${label})`;
}
