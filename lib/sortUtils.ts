/**
 * Column sorting utilities — pure functions for stable row sorting with
 * auto-detected numeric vs text columns and mixed-value fallback (Story 5).
 */

export type SortDirection = "asc" | "desc";

export interface SortState {
  colIdx: number;
  direction: SortDirection;
}

export type ColumnType = "numeric" | "text";

function trimNonEmpty(s: string): string | null {
  const t = s.trim();
  return t === "" ? null : t;
}

/** Parses a trimmed non-empty string to a finite number, or null if not numeric. */
export function parseFiniteNumber(s: string): number | null {
  const t = trimNonEmpty(s);
  if (t === null) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/**
 * Returns `numeric` only when every non-empty, trimmed value parses as a finite number.
 * Empty/whitespace-only cells are ignored for detection. All-blank → `text`.
 */
export function detectColumnType(values: readonly string[]): ColumnType {
  const samples = values
    .map((v) => trimNonEmpty(v))
    .filter((v): v is string => v !== null);
  if (samples.length === 0) return "text";
  const allNumeric = samples.every((s) => parseFiniteNumber(s) !== null);
  return allNumeric ? "numeric" : "text";
}

/**
 * Compare two cell strings for sorting.
 * - `numeric`: compare parsed numbers; blanks sort last.
 * - `text`: mixed numeric vs non-numeric — ascending puts numbers before letters; descending puts letters before numbers (Story 5).
 */
export function compareValues(
  a: string,
  b: string,
  type: ColumnType
): number {
  if (type === "numeric") {
    const na = parseFiniteNumber(a);
    const nb = parseFiniteNumber(b);
    if (na === null && nb === null) return 0;
    if (na === null) return 1;
    if (nb === null) return -1;
    return na - nb;
  }

  const na = parseFiniteNumber(a);
  const nb = parseFiniteNumber(b);
  const aNum = na !== null;
  const bNum = nb !== null;

  if (aNum && bNum) return na! - nb!;
  if (aNum && !bNum) return -1;
  if (!aNum && bNum) return 1;

  const ta = a.trim();
  const tb = b.trim();
  if (ta === "" && tb === "") return 0;
  if (ta === "") return 1;
  if (tb === "") return -1;

  return ta.localeCompare(tb, undefined, { sensitivity: "base" });
}

/** Blanks must stay at the end for both sort directions; matches `compareValues` blank rules. */
function isSortKeyBlank(value: string, type: ColumnType): boolean {
  if (type === "numeric") {
    return parseFiniteNumber(value) === null;
  }
  return value.trim() === "";
}

export function sortRowsWithSourceIndices(
  rows: readonly string[][],
  sourceIndices: readonly number[],
  colIdx: number,
  direction: SortDirection
): { rows: string[][]; sourceIndices: number[] } {
  if (rows.length !== sourceIndices.length) {
    throw new Error("rows and sourceIndices length mismatch");
  }

  const values = rows.map((r) =>
    colIdx >= 0 && colIdx < r.length ? r[colIdx] ?? "" : ""
  );
  const type = detectColumnType(values);

  const withIndex = rows.map((row, i) => ({
    row: row.slice(),
    sourceIndex: sourceIndices[i] ?? i,
    i,
  }));

  withIndex.sort((x, y) => {
    const va =
      colIdx >= 0 && colIdx < x.row.length ? x.row[colIdx] ?? "" : "";
    const vb =
      colIdx >= 0 && colIdx < y.row.length ? y.row[colIdx] ?? "" : "";
    const blankA = isSortKeyBlank(va, type);
    const blankB = isSortKeyBlank(vb, type);
    if (blankA && blankB) {
      return x.i - y.i;
    }
    if (blankA && !blankB) {
      return 1;
    }
    if (!blankA && blankB) {
      return -1;
    }
    const cmp = compareValues(va, vb, type);
    if (cmp !== 0) {
      return direction === "asc" ? cmp : -cmp;
    }
    return x.i - y.i;
  });

  return {
    rows: withIndex.map((x) => x.row),
    sourceIndices: withIndex.map((x) => x.sourceIndex),
  };
}
