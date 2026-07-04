import Papa from "papaparse";
/**
 * CSV Parser — stable wrapper around PapaParse
 *
 * This module provides a stable, library-agnostic API for parsing CSV data.
 * The implementation uses PapaParse internally, but that is an implementation
 * detail. The exported types and function signature are designed to be stable
 * even if the underlying parsing library is swapped.
 */

/**
 * Supported CSV delimiters
 */
export type Delimiter = "," | "|" | " ";

/**
 * Represents a single parsing error with line number and message
 * Line numbers are 1-indexed (human-friendly) and refer to the physical
 * line in the original input (accounting for skipped blank lines and
 * multi-line quoted fields).
 */
export interface ParseError {
  line: number;
  message: string;
}

/**
 * Result of parsing CSV input
 * - rows: 2D array of strings (all values are strings, no type coercion)
 * - errors: array of errors encountered during parsing (empty on success)
 */
export interface ParseResult {
  rows: string[][];
  errors: ParseError[];
}

/**
 * Options for CSV parsing
 * Designed with optional fields so future additions are non-breaking
 */
export interface ParseOptions {
  delimiter?: Delimiter;
}

/**
 * True when a parsed row carries no meaningful content — an empty line or a
 * line whose every field is blank/whitespace. Mirrors PapaParse's "greedy"
 * empty-line behavior, which we replicate manually so we can retain accurate
 * physical line numbers for the rows we keep.
 */
function isEmptyRow(row: string[]): boolean {
  return row.every((cell) => cell.trim() === "");
}

/**
 * Detects rows whose column count differs from the reference (first) row.
 *
 * PapaParse only reports field-count mismatches when `header: true`; with
 * `header: false` (how this app parses) ragged rows pass silently, so we
 * detect them ourselves. `lineOfRow[i]` is the physical line of `rows[i]`.
 */
function detectFieldMismatches(
  rows: string[][],
  lineOfRow: number[]
): ParseError[] {
  if (rows.length < 2) return [];
  const expected = rows[0].length;
  const errors: ParseError[] = [];
  for (let i = 1; i < rows.length; i += 1) {
    const found = rows[i].length;
    if (found !== expected) {
      errors.push({
        line: lineOfRow[i]!,
        message: `Expected ${expected} ${
          expected === 1 ? "column" : "columns"
        } but found ${found}`,
      });
    }
  }
  return errors;
}

// ============================================================================
// SECTION 4: Exported public function
// ============================================================================

/**
 * Parse CSV input into a 2D array of strings with error reporting
 *
 * @param input - The raw CSV string to parse
 * @param options - Optional configuration (delimiter, etc.)
 * @returns ParseResult with rows and errors arrays
 *
 * @example
 * ```typescript
 * const result = parseCSV("a,b\nc,d");
 * // result.rows === [["a", "b"], ["c", "d"]]
 * // result.errors === []
 *
 * const result2 = parseCSV('"hello, world",foo');
 * // result2.rows === [["hello, world", "foo"]]
 *
 * const result3 = parseCSV('a,b\n"unclosed');
 * // result3.rows contains partial data
 * // result3.errors contains the parsing error with line number
 * ```
 */
export function parseCSV(input: string, options?: ParseOptions): ParseResult {
  // Resolve delimiter from options, default to comma
  const delimiter: Delimiter = options?.delimiter ?? ",";

  // Edge case: empty or whitespace-only input
  // PapaParse on "" returns { data: [[""]], errors: [] } which is incorrect
  // We prevent this by early return
  if (input.trim() === "") {
    return { rows: [], errors: [] };
  }

  const rows: string[][] = [];
  const errors: ParseError[] = [];
  // Physical (1-indexed) start line for each retained row in `rows`.
  const lineOfRow: number[] = [];

  // Cursor bookkeeping: we count newlines incrementally as PapaParse's cursor
  // advances so each row's physical start line stays exact (O(n) overall),
  // even with skipped blank lines or multi-line quoted fields.
  let rowStart = 0; // character offset where the current row begins
  let scanIndex = 0; // how far we've counted newlines
  let newlinesBefore = 0; // newline count in input[0, scanIndex)

  // We parse with skipEmptyLines: false so PapaParse invokes `step` for every
  // physical row (no gaps), keeping the cursor→line mapping contiguous. Empty
  // rows are filtered out below to preserve the previous "greedy" behavior.
  Papa.parse<string[]>(input, {
    delimiter,
    quoteChar: '"',
    escapeChar: '"',
    skipEmptyLines: false,
    header: false, // always return raw string[][]
    step: (results) => {
      while (scanIndex < rowStart) {
        if (input.charCodeAt(scanIndex) === 10 /* \n */) newlinesBefore += 1;
        scanIndex += 1;
      }
      const startLine = newlinesBefore + 1;
      rowStart = results.meta.cursor;

      const row = results.data;
      if (isEmptyRow(row)) {
        // Empty lines are dropped, but still surface any parser error on them.
        for (const err of results.errors) {
          errors.push({ line: startLine, message: err.message });
        }
        return;
      }

      rows.push(row);
      lineOfRow.push(startLine);
      for (const err of results.errors) {
        errors.push({ line: startLine, message: err.message });
      }
    },
  });

  // Ragged-row detection (PapaParse skips this with header: false).
  errors.push(...detectFieldMismatches(rows, lineOfRow));

  // Present errors in physical-line order for a predictable reading experience.
  errors.sort((a, b) => a.line - b.line);

  return { rows, errors };
}
