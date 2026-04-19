"use client";

import { useMemo } from "react";

export const MIN_COLS = 26;
export const MIN_ROWS = 50;

export function colLabel(idx: number): string {
  let label = "";
  let i = idx + 1;
  while (i > 0) {
    label = String.fromCharCode(64 + ((i - 1) % 26) + 1) + label;
    i = Math.floor((i - 1) / 26);
  }
  return label;
}

export interface UseSpreadsheetGridArgs {
  data: string[][];
  firstRowAsHeader: boolean;
}

export interface SpreadsheetGridViewModel {
  isEmpty: boolean;
  numCols: number;
  /** Number of rows to render in `<tbody>` (padded to MIN_ROWS). */
  numRows: number;
  bodyRows: string[][];
  headerRowCells: string[] | null;
  rowNumberOffset: number;
  colLabel: (idx: number) => string;
  statusHint: string;
}

function computeViewModel(
  data: string[][],
  firstRowAsHeader: boolean
): SpreadsheetGridViewModel {
  const isEmpty = data.length === 0;

  const numCols = isEmpty
    ? MIN_COLS
    : Math.max(MIN_COLS, ...data.map((r) => r.length));

  let headerRowCells: string[] | null = null;
  let bodyRows: string[][] = [];
  let rowNumberOffset = 1;

  if (!isEmpty && firstRowAsHeader) {
    headerRowCells = data[0] ?? [];
    bodyRows = data.slice(1);
    rowNumberOffset = 2;
  } else if (!isEmpty) {
    bodyRows = data;
    rowNumberOffset = 1;
  }

  const bodyRowCount = bodyRows.length;
  const numRows = isEmpty
    ? MIN_ROWS
    : Math.max(MIN_ROWS, bodyRowCount);

  const statusHint = isEmpty
    ? "Ready \u2014 upload a .csv file to preview it here"
    : "\u00a0";

  return {
    isEmpty,
    numCols,
    numRows,
    bodyRows,
    headerRowCells,
    rowNumberOffset,
    colLabel,
    statusHint,
  };
}

export function useSpreadsheetGrid(
  args: UseSpreadsheetGridArgs
): SpreadsheetGridViewModel {
  const { data, firstRowAsHeader } = args;

  return useMemo(
    () => computeViewModel(data, firstRowAsHeader),
    [data, firstRowAsHeader]
  );
}

/** Exported for unit tests of pure view-model logic. */
export function computeSpreadsheetGridViewModel(
  data: string[][],
  firstRowAsHeader: boolean
): SpreadsheetGridViewModel {
  return computeViewModel(data, firstRowAsHeader);
}
