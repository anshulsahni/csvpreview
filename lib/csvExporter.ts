import type { Delimiter } from "./csvParser";
/**
 * CSV Exporter: serialize a 2D string array back to CSV text.
 *
 * This is the inverse of `parseCSV` in `csvParser.ts` and mirrors its RFC 4180
 * quoting rules: PapaParse is configured there with `quoteChar: '"'` and
 * `escapeChar: '"'` (quotes escaped by doubling). Keeping this pure and
 * framework-agnostic so it is easily unit-testable.
 */

/**
 * A cell must be quoted if it contains the active delimiter, a double quote, or
 * a line break (CR/LF). Quoting wraps the cell in double quotes and doubles any
 * embedded double quotes.
 */
function needsQuoting(cell: string, delimiter: Delimiter): boolean {
  return (
    cell.includes(delimiter) ||
    cell.includes('"') ||
    cell.includes("\n") ||
    cell.includes("\r")
  );
}

function encodeCell(cell: string, delimiter: Delimiter): string {
  if (needsQuoting(cell, delimiter)) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}

/**
 * Serialize a 2D array of strings into a CSV string.
 *
 * - Cells are joined with `delimiter`, rows with `\n`.
 * - No trailing newline (mirrors the parser, which treats trailing blank lines
 *   as empty input).
 * - Empty `rows` produces an empty string.
 *
 * @example
 * ```typescript
 * exportCSV([["a", "b"], ["c", "d"]]);          // "a,b\nc,d"
 * exportCSV([["hello, world", "foo"]]);          // '"hello, world",foo'
 * exportCSV([['say "hello"']]);                  // '"say ""hello"""'
 * exportCSV([["a", "b"]], "|");                  // "a|b"
 * ```
 */
export function exportCSV(
  rows: string[][],
  delimiter: Delimiter = ","
): string {
  return rows
    .map((row) => row.map((cell) => encodeCell(cell, delimiter)).join(delimiter))
    .join("\n");
}
