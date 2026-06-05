import { exportCSV } from "./csvExporter";
import {
  getSelectionBounds,
  type CellSelection,
} from "@/app/components/SpreadsheetGrid/selectionUtils";

export function rowsToCopyText(rows: string[][]): string {
  return exportCSV(rows);
}

export function selectedCellsToCopyText(
  bodyRows: string[][],
  selection: CellSelection
): string {
  const bounds = getSelectionBounds(selection);
  if (bounds === null) return "";

  const selectedRows: string[][] = [];
  for (let r = bounds.top; r <= bounds.bottom; r++) {
    const row = bodyRows[r] ?? [];
    selectedRows.push(row.slice(bounds.left, bounds.right + 1));
  }
  return exportCSV(selectedRows);
}
