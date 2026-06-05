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
  const slice = bodyRows
    .slice(bounds.top, bounds.bottom + 1)
    .map((row) => row.slice(bounds.left, bounds.right + 1));
  return exportCSV(slice);
}
