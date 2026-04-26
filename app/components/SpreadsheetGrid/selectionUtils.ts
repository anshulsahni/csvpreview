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

export interface SelectionAggregates {
  numericCount: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
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
  const noun = count === 1 ? "cell" : "cells";
  return `${count} ${noun} selected (${label})`;
}

function parseFiniteNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }
  const asNumber = Number(trimmed);
  return Number.isFinite(asNumber) ? asNumber : null;
}

export function computeSelectionAggregates(
  selection: CellSelection | null,
  rows: readonly string[][]
): SelectionAggregates | null {
  const bounds = getSelectionBounds(selection);
  if (bounds === null) {
    return null;
  }

  let numericCount = 0;
  let sum = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (let rowIdx = bounds.top; rowIdx <= bounds.bottom; rowIdx += 1) {
    const row = rows[rowIdx];
    if (row === undefined) {
      continue;
    }
    for (let colIdx = bounds.left; colIdx <= bounds.right; colIdx += 1) {
      const maybeNum = parseFiniteNumber(row[colIdx] ?? "");
      if (maybeNum === null) {
        continue;
      }

      numericCount += 1;
      sum += maybeNum;
      min = Math.min(min, maybeNum);
      max = Math.max(max, maybeNum);
    }
  }

  if (numericCount < 2) {
    return null;
  }

  return {
    numericCount,
    sum,
    avg: sum / numericCount,
    min,
    max,
  };
}

function formatAggregateNumber(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }
  return String(Number(value.toFixed(2)));
}

export function aggregationStatusHint(
  selection: CellSelection | null,
  rows: readonly string[][]
): string | null {
  const aggregates = computeSelectionAggregates(selection, rows);
  if (aggregates === null) {
    return null;
  }

  return `Sum: ${formatAggregateNumber(aggregates.sum)} · Avg: ${formatAggregateNumber(aggregates.avg)} · Min: ${formatAggregateNumber(aggregates.min)} · Max: ${formatAggregateNumber(aggregates.max)}`;
}
