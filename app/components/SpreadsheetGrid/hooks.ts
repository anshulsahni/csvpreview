"use client";

import { useMemo, useState } from "react";
import {
  detectColumnType,
  sortRows,
  type SortDirection,
  type SortState,
} from "@/lib/sortUtils";
import { colLabel, type CellSelection } from "./selectionUtils";
import { useSpreadsheetGridSelection } from "./useSpreadsheetGridSelection";
import {
  applyFilters,
  getUniqueValues,
  type ColumnFilter,
  type FilterMap,
} from "@/lib/filterUtils";

export const MIN_COLS = 26;
export const MIN_ROWS = 50;

export type { SortState } from "@/lib/sortUtils";
export type { CellSelection, SelectionBounds } from "./selectionUtils";
export {
  aggregationStatusHint,
  computeSelectionAggregates,
  colLabel,
  getSelectionBounds,
  isCellSelected,
  cellRangeLabel,
} from "./selectionUtils";
export { useSelectionState } from "./useSpreadsheetGridSelection";

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
  filters: FilterMap;
  openColIdx: number | null;
  totalRowCount: number;
  visibleRowCount: number;
  activeFilterCount: number;
  columnTypeFor: (colIdx: number) => "numeric" | "text";
  uniqueValuesFor: (colIdx: number) => string[];
  columnDisplayName: (colIdx: number) => string;
  selection: CellSelection | null;
  isDragging: boolean;
  isCellSelected: (rowIdx: number, colIdx: number) => boolean;
  onSortArrowClick: (colIdx: number, direction: SortDirection) => void;
  onCellMouseDown: (rowIdx: number, colIdx: number) => void;
  onCellMouseEnter: (rowIdx: number, colIdx: number) => void;
  onColumnHeaderMouseDown: (colIdx: number) => void;
  onRowGutterMouseDown: (rowIdx: number) => void;
  openDropdown: (colIdx: number) => void;
  closeDropdown: () => void;
  setFilter: (colIdx: number, filter: ColumnFilter | null) => void;
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

export function useFilterState(): {
  filters: FilterMap;
  openColIdx: number | null;
  openDropdown: (colIdx: number) => void;
  closeDropdown: () => void;
  setFilter: (colIdx: number, filter: ColumnFilter | null) => void;
} {
  const [filters, setFilters] = useState<FilterMap>({});
  const [openColIdx, setOpenColIdx] = useState<number | null>(null);

  const openDropdown = (colIdx: number) => {
    setOpenColIdx((prev) => (prev === colIdx ? null : colIdx));
  };

  const closeDropdown = () => {
    setOpenColIdx(null);
  };

  const setFilter = (colIdx: number, filter: ColumnFilter | null) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (filter === null) {
        delete next[colIdx];
      } else {
        next[colIdx] = filter;
      }
      return next;
    });
  };

  return { filters, openColIdx, openDropdown, closeDropdown, setFilter };
}

function getColumnDisplayName(
  firstRowAsHeader: boolean,
  headerRowCells: string[] | null,
  colIdx: number
): string {
  if (firstRowAsHeader) {
    const header = (headerRowCells?.[colIdx] ?? "").trim();
    if (header !== "") return header;
  }
  return colLabel(colIdx);
}

function computeViewModel(
  data: string[][],
  firstRowAsHeader: boolean,
  sort: SortState | null,
  filters: FilterMap
): Omit<
  SpreadsheetGridViewModel,
  | "onSortArrowClick"
  | "openDropdown"
  | "closeDropdown"
  | "setFilter"
  | "openColIdx"
  | "selection"
  | "isDragging"
  | "isCellSelected"
  | "onCellMouseDown"
  | "onCellMouseEnter"
  | "onColumnHeaderMouseDown"
  | "onRowGutterMouseDown"
> {
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

  const totalRowCount = bodyRows.length;
  const filteredRows =
    totalRowCount > 0 ? applyFilters(bodyRows, filters) : bodyRows;
  const displayBodyRows =
    sort !== null && filteredRows.length > 0
      ? sortRows(filteredRows, sort.colIdx, sort.direction)
      : filteredRows;
  const visibleRowCount = displayBodyRows.length;
  const activeFilterEntries = Object.entries(filters);
  const activeFilterCount = activeFilterEntries.length;

  const columnTypeByIdx = new Map<number, "numeric" | "text">();
  const uniqueValuesByIdx = new Map<number, string[]>();
  for (let ci = 0; ci < numCols; ci += 1) {
    const values = bodyRows.map((row) => (row[ci] ?? "").trim());
    columnTypeByIdx.set(ci, detectColumnType(values));
    uniqueValuesByIdx.set(ci, getUniqueValues(bodyRows, ci));
  }

  const numRows = isEmpty
    ? MIN_ROWS
    : Math.max(MIN_ROWS, visibleRowCount);

  let statusHint: string;
  if (isEmpty) {
    statusHint = "Ready \u2014 upload a .csv file to preview it here";
  } else {
    const parts: string[] = [];

    if (activeFilterCount === 1) {
      const [firstKey] = activeFilterEntries[0];
      const filterColIdx = Number(firstKey);
      parts.push(
        `Filter active on ${getColumnDisplayName(firstRowAsHeader, headerRowCells, filterColIdx)}`
      );
      parts.push(`Showing ${visibleRowCount} of ${totalRowCount} rows`);
    } else if (activeFilterCount > 1) {
      parts.push(`Filters active on ${activeFilterCount} columns`);
      parts.push(`Showing ${visibleRowCount} of ${totalRowCount} rows`);
    }

    if (sort !== null && filteredRows.length > 0) {
      const dirLabel = sort.direction === "asc" ? "asc" : "desc";
      parts.push(`Sorted by col ${colLabel(sort.colIdx)} ${dirLabel}`);
    }

    statusHint = parts.length > 0 ? parts.join(" \u00b7 ") : "\u00a0";
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
    filters,
    totalRowCount,
    visibleRowCount,
    activeFilterCount,
    columnTypeFor: (colIdx: number) => columnTypeByIdx.get(colIdx) ?? "text",
    uniqueValuesFor: (colIdx: number) => uniqueValuesByIdx.get(colIdx) ?? [],
    columnDisplayName: (colIdx: number) =>
      getColumnDisplayName(firstRowAsHeader, headerRowCells, colIdx),
  };
}

export function useSpreadsheetGrid(
  { data, firstRowAsHeader }: UseSpreadsheetGridArgs
): SpreadsheetGridViewModel {
  const { sort, onArrowClick } = useSortState();
  const {
    filters,
    openColIdx,
    openDropdown,
    closeDropdown,
    setFilter,
  } = useFilterState();

  const base = useMemo(
    () => computeViewModel(data, firstRowAsHeader, sort, filters),
    [data, firstRowAsHeader, sort, filters]
  );

  const {
    selection,
    isDragging,
    statusHint: combinedStatusHint,
    onCellMouseDown,
    onCellMouseEnter,
    onColumnHeaderMouseDown,
    onRowGutterMouseDown,
    isCellSelected,
  } = useSpreadsheetGridSelection({
    numRows: base.visibleRowCount,
    numCols: base.numCols,
    isEmpty: base.isEmpty,
    rowNumberOffset: base.rowNumberOffset,
    bodyRows: base.bodyRows,
    baseStatusHint: base.statusHint,
    sort,
    filters,
    firstRowAsHeader,
  });

  return useMemo(
    () => ({
      ...base,
      statusHint: combinedStatusHint,
      selection,
      isDragging,
      isCellSelected,
      onSortArrowClick: onArrowClick,
      onCellMouseDown,
      onCellMouseEnter,
      onColumnHeaderMouseDown,
      onRowGutterMouseDown,
      openColIdx,
      openDropdown,
      closeDropdown,
      setFilter,
    }),
    [
      base,
      combinedStatusHint,
      selection,
      isDragging,
      isCellSelected,
      onArrowClick,
      onCellMouseDown,
      onCellMouseEnter,
      onColumnHeaderMouseDown,
      onRowGutterMouseDown,
      openColIdx,
      openDropdown,
      closeDropdown,
      setFilter,
    ]
  );
}

/** Exported for unit tests of pure view-model logic. */
export function computeSpreadsheetGridViewModel(
  data: string[][],
  firstRowAsHeader: boolean,
  sort: SortState | null = null,
  filters: FilterMap = {}
): Omit<
  SpreadsheetGridViewModel,
  | "onSortArrowClick"
  | "openDropdown"
  | "closeDropdown"
  | "setFilter"
  | "openColIdx"
  | "selection"
  | "isDragging"
  | "isCellSelected"
  | "onCellMouseDown"
  | "onCellMouseEnter"
  | "onColumnHeaderMouseDown"
  | "onRowGutterMouseDown"
> {
  return computeViewModel(data, firstRowAsHeader, sort, filters);
}
