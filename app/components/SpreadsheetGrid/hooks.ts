"use client";

import { useMemo, useState } from "react";
import {
  sortRows,
  type SortDirection,
} from "@/lib/sortUtils";

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

export interface SortState {
  colIdx: number;
  direction: SortDirection;
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
  /** Body rows after optional sort (display order). */
  bodyRows: string[][];
  headerRowCells: string[] | null;
  rowNumberOffset: number;
  colLabel: (idx: number) => string;
  statusHint: string;
  sort: SortState | null;
  onSortArrowClick: (colIdx: number, direction: SortDirection) => void;
}

export function useSortState(): {
  sort: SortState | null;
  onArrowClick: (colIdx: number, direction: SortDirection) => void;
} {
  const [sort, setSort] = useState<SortState | null>(null);

  const onArrowClick = (colIdx: number, direction: SortDirection) => {
    setSort((prev) => {
      if (
        prev !== null &&
        prev.colIdx === colIdx &&
        prev.direction === direction
      ) {
        return null;
      }
      return { colIdx, direction };
    });
  };

  return { sort, onArrowClick };
}

function computeViewModel(
  data: string[][],
  firstRowAsHeader: boolean,
  sort: SortState | null
): Omit<SpreadsheetGridViewModel, "onSortArrowClick"> {
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

  const displayBodyRows =
    sort !== null && bodyRows.length > 0
      ? sortRows(bodyRows, sort.colIdx, sort.direction)
      : bodyRows;

  const bodyRowCount = displayBodyRows.length;
  const numRows = isEmpty
    ? MIN_ROWS
    : Math.max(MIN_ROWS, bodyRowCount);

  let statusHint: string;
  if (isEmpty) {
    statusHint = "Ready \u2014 upload a .csv file to preview it here";
  } else if (sort !== null && bodyRows.length > 0) {
    const dirLabel = sort.direction === "asc" ? "asc" : "desc";
    statusHint = `${bodyRows.length} rows \u00b7 Sorted by col ${colLabel(sort.colIdx)} ${dirLabel}`;
  } else {
    statusHint = "\u00a0";
  }

  return {
    isEmpty,
    numCols,
    numRows,
    bodyRows: displayBodyRows,
    headerRowCells,
    rowNumberOffset,
    colLabel,
    statusHint,
    sort,
  };
}

export function useSpreadsheetGrid(
  { data, firstRowAsHeader }: UseSpreadsheetGridArgs
): SpreadsheetGridViewModel {
  const { sort, onArrowClick } = useSortState();

  const base = useMemo(
    () => computeViewModel(data, firstRowAsHeader, sort),
    [data, firstRowAsHeader, sort]
  );

  return useMemo(
    () => ({
      ...base,
      onSortArrowClick: onArrowClick,
    }),
    [base, onArrowClick]
  );
}

/** Exported for unit tests of pure view-model logic. */
export function computeSpreadsheetGridViewModel(
  data: string[][],
  firstRowAsHeader: boolean,
  sort: SortState | null = null
): Omit<SpreadsheetGridViewModel, "onSortArrowClick"> {
  return computeViewModel(data, firstRowAsHeader, sort);
}
