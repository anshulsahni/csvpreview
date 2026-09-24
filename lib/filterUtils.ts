import { parseFiniteNumber, textCollator } from "@/lib/sortUtils";

export type NumericOperator = "=" | "!=" | "<" | "<=" | ">" | ">=";

export type ColumnFilter =
  | { kind: "set"; values: Set<string> }
  | { kind: "numeric"; op: NumericOperator; value: number };

export type FilterMap = Record<number, ColumnFilter>;

function normalizeCellValue(row: readonly string[], colIdx: number): string {
  if (colIdx < 0 || colIdx >= row.length) return "";
  return (row[colIdx] ?? "").trim();
}

export function getUniqueValues(
  rows: readonly string[][],
  colIdx: number
): string[] {
  const unique = new Set<string>();
  for (const row of rows) {
    unique.add(normalizeCellValue(row, colIdx));
  }
  return Array.from(unique).sort(textCollator.compare);
}

export function matchesNumericFilter(
  cell: string,
  filter: Extract<ColumnFilter, { kind: "numeric" }>
): boolean {
  const cellNumber = parseFiniteNumber(cell);
  if (cellNumber === null) return false;

  switch (filter.op) {
    case "=":
      return cellNumber === filter.value;
    case "!=":
      return cellNumber !== filter.value;
    case "<":
      return cellNumber < filter.value;
    case "<=":
      return cellNumber <= filter.value;
    case ">":
      return cellNumber > filter.value;
    case ">=":
      return cellNumber >= filter.value;
    default:
      return false;
  }
}

export function applyFiltersWithSourceIndices(
  rows: readonly string[][],
  sourceIndices: readonly number[],
  filters: FilterMap
): { rows: string[][]; sourceIndices: number[] } {
  if (rows.length !== sourceIndices.length) {
    throw new Error("rows and sourceIndices length mismatch");
  }

  const activeEntries = Object.entries(filters).filter(([, filter]) => {
    if (filter.kind === "set") return filter.values.size > 0;
    return Number.isFinite(filter.value);
  });

  // Both paths share the caller's rows rather than cloning them: the outer array
  // is new, so callers still get a fresh list to sort, but a no-op re-filter of a
  // large sheet no longer copies every cell. Rows are never mutated in place.
  if (activeEntries.length === 0) {
    return {
      rows: rows.slice(),
      sourceIndices: [...sourceIndices],
    };
  }

  const outRows: string[][] = [];
  const outSourceIndices: number[] = [];

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i] ?? [];
    const matches = activeEntries.every(([colKey, filter]) => {
      const colIdx = Number(colKey);
      const cell = normalizeCellValue(row, colIdx);
      if (filter.kind === "set") return filter.values.has(cell);
      return matchesNumericFilter(cell, filter);
    });

    if (matches) {
      outRows.push(row);
      outSourceIndices.push(sourceIndices[i] ?? i);
    }
  }

  return { rows: outRows, sourceIndices: outSourceIndices };
}
