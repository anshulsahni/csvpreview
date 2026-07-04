import type { CountPillsProps } from "./CountPills";

function pluralize(word: string, count: number): string {
  return count === 1 ? word : `${word}s`;
}

/**
 * Build the human-readable labels for the row and column pills.
 *
 * When a filter is active the row label reports the visible-of-total count
 * (e.g. "120 of 5,000 rows"); otherwise it reports the total (e.g. "5,000 rows").
 *
 * Pure and exported for unit testing.
 */
export function computePillLabels({
  rowCount,
  totalRowCount,
  columnCount,
  hasActiveFilter,
}: CountPillsProps): { rowsLabel: string; columnsLabel: string } {
  const rowsLabel = hasActiveFilter
    ? `${rowCount.toLocaleString()} of ${totalRowCount.toLocaleString()} rows`
    : `${totalRowCount.toLocaleString()} ${pluralize("row", totalRowCount)}`;
  const columnsLabel = `${columnCount.toLocaleString()} ${pluralize("column", columnCount)}`;
  return { rowsLabel, columnsLabel };
}

/**
 * Derive row and column counts directly from parsed CSV rows, for static
 * (non-editable, unfiltered) contexts such as dataset pages.
 *
 * Row count excludes the header row when `firstRowAsHeader` is set. Column
 * count is the true maximum row width — deliberately NOT the display-padded
 * `numCols`/`MIN_COLS` used by the grid renderer.
 *
 * Pure and exported for unit testing.
 */
export function computeCsvCounts(
  data: string[][],
  firstRowAsHeader: boolean
): {
  rowCount: number;
  totalRowCount: number;
  columnCount: number;
  hasActiveFilter: false;
} {
  const rowCount = firstRowAsHeader
    ? Math.max(0, data.length - 1)
    : data.length;
  const columnCount = data.reduce((max, row) => Math.max(max, row.length), 0);
  return {
    rowCount,
    totalRowCount: rowCount,
    columnCount,
    hasActiveFilter: false,
  };
}
