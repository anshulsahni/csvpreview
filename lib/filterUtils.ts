import { parseFiniteNumber } from "@/lib/sortUtils";

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
  return Array.from(unique).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
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

export function applyFilters(
  rows: readonly string[][],
  filters: FilterMap
): string[][] {
  const activeEntries = Object.entries(filters).filter(([, filter]) => {
    if (filter.kind === "set") return filter.values.size > 0;
    return Number.isFinite(filter.value);
  });

  if (activeEntries.length === 0) return rows.map((row) => row.slice());

  return rows
    .filter((row) =>
      activeEntries.every(([colKey, filter]) => {
        const colIdx = Number(colKey);
        const cell = normalizeCellValue(row, colIdx);
        if (filter.kind === "set") return filter.values.has(cell);
        return matchesNumericFilter(cell, filter);
      })
    )
    .map((row) => row.slice());
}
