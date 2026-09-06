import type { ParseError, ParseResult } from "./csvParser";

/**
 * JSON Importer: turn JSON text into CSV-shaped rows.
 *
 * The exact inverse of `jsonExporter.ts`, and its mirror in style — pure,
 * framework-agnostic and dependency-free. The `ParseError`/`ParseResult` types
 * come from `csvParser` as **type-only** imports, which are erased at compile
 * time, so this module carries no runtime dependency on PapaParse while still
 * producing errors the upload modal can render unchanged.
 *
 * Only one JSON shape converts: a top-level **array of objects** whose every
 * value is a primitive. Anything else is reported rather than coerced — a
 * nested object has no single sensible cell representation, and silently
 * flattening or stringifying it would lose data the user did not agree to lose.
 */

/** A JSON value that fits in a CSV cell. */
export type JsonCellValue = string | number | boolean | null;

/**
 * How many shape violations are reported in full before the rest are collapsed
 * into a single summary line. A 100k-row file with one systematic flaw would
 * otherwise build 100k error objects and stall the error list's render.
 */
export const MAX_SHAPE_ERRORS = 50;

/** True for a JSON object — not `null`, not an array. */
function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Name a JSON value's type the way the error messages read it.
 *
 * @example
 * ```typescript
 * describeJsonType([]);    // "an array"
 * describeJsonType(null);  // "null"
 * ```
 */
export function describeJsonType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "an array";
  switch (typeof value) {
    case "object":
      return "an object";
    case "string":
      return "a string";
    case "number":
      return "a number";
    case "boolean":
      return "a boolean";
    default:
      return "an unsupported value";
  }
}

/**
 * Render one JSON value as a CSV cell. Pure and deterministic.
 *
 * - `null` becomes an empty cell — CSV has no null, and `jsonExporter` fills
 *   missing values with `""` for the same reason. Lossy in one direction: a
 *   `null` and an empty string are indistinguishable after import.
 * - Strings are copied verbatim, so `"007"` stays `"007"` rather than becoming
 *   `7`.
 * - Booleans become `true`/`false` in lower case, matching the JSON literal.
 *   (`xlsxImporter.cellToString` upper-cases them because that is how Excel
 *   *displays* booleans; the source here is JSON, so the source spelling wins.)
 * - Numbers go through `String`, which switches to exponent notation at `1e21`
 *   and below `1e-6`. Integers beyond 2^53 have already lost precision inside
 *   `JSON.parse`, before this function ever sees them.
 */
export function jsonValueToCell(value: JsonCellValue): string {
  if (value === null) return "";
  if (typeof value === "string") return value;
  return String(value);
}

/**
 * Build the header row: the union of every record's keys, in first-seen order.
 *
 * The union matters — taking only the first object's keys would silently drop a
 * whole column whenever the first record happens to omit a field that later
 * records carry.
 *
 * Note that `Object.keys` lists integer-like keys first, in ascending numeric
 * order, so `[{ "2": "a", "1": "b" }]` yields `["1", "2"]`. That is a JavaScript
 * rule rather than a choice made here.
 *
 * @example
 * ```typescript
 * deriveHeaderRow([{ b: 1 }, { a: 2 }]);  // ["b", "a"]
 * ```
 */
export function deriveHeaderRow(
  records: Record<string, JsonCellValue>[]
): string[] {
  const seen = new Set<string>();
  const headerRow: string[] = [];
  for (const record of records) {
    for (const key of Object.keys(record)) {
      if (seen.has(key)) continue;
      seen.add(key);
      headerRow.push(key);
    }
  }
  return headerRow;
}

/**
 * List every reason an already-parsed JSON value cannot become a CSV sheet, in
 * document order. Returns `[]` when the value is convertible.
 *
 * Violations are located by **JSON path** (`$[3].tags`) rather than by line.
 * A path is exact and survives minified input, where a line number would point
 * every error at line 1.
 *
 * At most `MAX_SHAPE_ERRORS` violations are described; the remainder are
 * counted and collapsed into one trailing summary error.
 */
export function collectShapeErrors(parsed: unknown): ParseError[] {
  if (!Array.isArray(parsed)) {
    const message = isJsonObject(parsed)
      ? "Top level must be an array of objects, but found a single object. Wrap it in [ ] to convert one row."
      : `Top level must be an array of objects, but found ${describeJsonType(
          parsed
        )}.`;
    return [{ line: 0, message }];
  }

  const errors: ParseError[] = [];
  let overflow = 0;

  // Past the cap we keep counting but stop building messages — the count stays
  // accurate without allocating an error per row of a uniformly broken file.
  function report(message: string): void {
    if (errors.length >= MAX_SHAPE_ERRORS) {
      overflow += 1;
      return;
    }
    errors.push({ line: 0, message });
  }

  parsed.forEach((element, index) => {
    if (!isJsonObject(element)) {
      const suffix = Array.isArray(element)
        ? " Arrays of arrays are not supported."
        : "";
      report(
        `$[${index}]: expected an object, but found ${describeJsonType(
          element
        )}.${suffix}`
      );
      return;
    }
    for (const [key, value] of Object.entries(element)) {
      if (value === null || typeof value !== "object") continue;
      const kind = Array.isArray(value) ? "arrays" : "objects";
      report(
        `$[${index}].${key}: nested ${kind} are not supported — every value must be a string, number, true, false or null.`
      );
    }
  });

  if (overflow > 0) {
    errors.push({ line: 0, message: `…and ${overflow} more issues.` });
  }
  return errors;
}

/** Strip the engine's own location clause; we render our own line number. */
function cleanSyntaxMessage(message: string): string {
  return message
    .replace(/^JSON\.parse:\s*/i, "")
    .replace(/\s*(?:in JSON\s*)?at position \d+(?:\s*\(line \d+ column \d+\))?\s*$/i, "")
    .replace(/\s*at line \d+ column \d+(?: of the JSON data)?\s*\.?$/i, "")
    .trim();
}

/**
 * Turn a `JSON.parse` `SyntaxError` message into a located, user-facing error.
 *
 * The message is taken as a **plain string** rather than read off a thrown
 * error, so this stays a pure function that can be unit-tested against every
 * engine's wording without depending on the one the tests happen to run in.
 * That matters, because the wording is neither standardised nor stable:
 *
 * | Engine | Example |
 * |---|---|
 * | V8 | `Expected property name or '}' in JSON at position 1 (line 1 column 2)` |
 * | V8 | `Unexpected end of JSON input` — no position at all |
 * | Firefox | `JSON.parse: unexpected character at line 2 column 3 of the JSON data` |
 * | Safari | `JSON Parse error: Unexpected identifier` — no position at all |
 *
 * So the line is resolved in three tiers: a character offset (counted into a
 * line here, which is engine-agnostic and CRLF-safe), else an explicit line
 * number, else `0` — which the modal renders as a bare message with no line
 * prefix.
 */
export function describeSyntaxError(
  message: string,
  input: string
): ParseError {
  let line = 0;

  const positionMatch = /\bat position (\d+)/i.exec(message);
  if (positionMatch) {
    // Clamp: "Unexpected end of input" style errors can point one past the end.
    const position = Math.min(Number(positionMatch[1]), input.length);
    let newlines = 0;
    for (let i = 0; i < position; i += 1) {
      if (input.charCodeAt(i) === 10 /* \n */) newlines += 1;
    }
    line = newlines + 1;
  } else {
    const lineMatch = /\bline (\d+)/i.exec(message);
    if (lineMatch) line = Number(lineMatch[1]);
  }

  return { line, message: `Invalid JSON: ${cleanSyntaxMessage(message)}` };
}

/**
 * Parse JSON text into a 2D array of strings, header row first.
 *
 * @param input - Raw JSON text.
 * @returns `ParseResult` with `rows` (row 0 is the header) and `errors`.
 *   Nothing is returned in `rows` when there are errors — a partially
 *   convertible file is not loaded, matching how `parseCSV` is consumed.
 *
 * Blank input, `[]` and an array of empty objects all come back as
 * `{ rows: [], errors: [] }`, mirroring `parseCSV`'s early return; the caller's
 * existing "no rows" branch turns them into a single "No data found" message.
 *
 * @example
 * ```typescript
 * parseJSON('[{"id":1,"name":"Ann"},{"id":2}]');
 * // rows: [["id", "name"], ["1", "Ann"], ["2", ""]]
 *
 * parseJSON('[{"a":{"b":1}}]');
 * // errors: [{ line: 0, message: "$[0].a: nested objects are not supported — …" }]
 * ```
 */
export function parseJSON(input: string): ParseResult {
  if (input.trim() === "") return { rows: [], errors: [] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { rows: [], errors: [describeSyntaxError(message, input)] };
  }

  const shapeErrors = collectShapeErrors(parsed);
  if (shapeErrors.length > 0) return { rows: [], errors: shapeErrors };

  // `collectShapeErrors` returning clean is what makes this cast safe.
  const records = parsed as Record<string, JsonCellValue>[];
  const headerRow = deriveHeaderRow(records);
  if (headerRow.length === 0) return { rows: [], errors: [] };

  // Iteration is driven by the header, so every row has the same width and a
  // key missing from a record becomes an empty cell — the same rule
  // `rowsToJsonRecords` applies in the other direction.
  const bodyRows = records.map((record) =>
    headerRow.map((key) =>
      jsonValueToCell(
        Object.prototype.hasOwnProperty.call(record, key) ? record[key] : null,
      ),
    ),
  );
  return { rows: [headerRow, ...bodyRows], errors: [] };
}
