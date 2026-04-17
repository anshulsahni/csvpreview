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
 * Line numbers are 1-indexed (human-friendly)
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
 * Maps a PapaParse error to our ParseError interface
 * Converts 0-indexed row to 1-indexed line number
 */
function mapPapaError(papaError: Papa.ParseError): ParseError {
  return {
    line: (papaError.row ?? 0) + 1, // PapaParse uses 0-indexed rows; we use 1-indexed lines
    message: papaError.message,
  };
}

/**
 * Maps a PapaParse result to our ParseResult interface
 */
function mapPapaResult(papaResult: Papa.ParseResult<string[]>): ParseResult {
  return {
    rows: papaResult.data,
    errors: papaResult.errors.map(mapPapaError),
  };
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

  // Call PapaParse synchronously (Papa.parse on a string is always sync)
  const result = Papa.parse<string[]>(input, {
    delimiter,
    quoteChar: '"',
    escapeChar: '"',
    skipEmptyLines: "greedy", // skip blank AND whitespace-only lines
    header: false, // always return raw string[][]
  });

  // Map PapaParse result to our stable types
  return mapPapaResult(result);
}
