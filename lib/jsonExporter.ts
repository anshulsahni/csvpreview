/**
 * JSON Exporter: turn a header row plus body rows into an array of JSON
 * objects.
 *
 * Sibling of `csvExporter.ts` / `xlsxExporter.ts` — pure, framework-agnostic
 * and easily unit-testable. A header row is required: it supplies the object
 * keys, so exporting to JSON is only meaningful when the sheet's first row is
 * being treated as a header.
 */

/**
 * Convert body rows into one object per row, keyed by the header row's cells.
 *
 * Iteration is driven by the **header**, not by each row, which fixes the
 * behaviour on ragged input:
 * - a row shorter than the header gets `""` for the missing columns, so every
 *   object has the same shape;
 * - a row longer than the header loses its extra cells — they have no key;
 * - duplicate header names collapse, with the right-most column winning (a JSON
 *   object cannot hold the same key twice);
 * - an empty header cell is kept verbatim as the key `""`.
 *
 * Every value is a string, copied verbatim — no type coercion, so `"007"` stays
 * `"007"` rather than becoming `7`.
 *
 * @example
 * ```typescript
 * rowsToJsonRecords(["id", "name"], [["1", "Ann"], ["2"]]);
 * // [{ id: "1", name: "Ann" }, { id: "2", name: "" }]
 * ```
 */
export function rowsToJsonRecords(
  headerRow: string[],
  bodyRows: string[][]
): Record<string, string>[] {
  return bodyRows.map((row) => {
    const record: Record<string, string> = {};
    headerRow.forEach((key, colIdx) => {
      record[key] = row[colIdx] ?? "";
    });
    return record;
  });
}

/**
 * Serialize a header row and its body rows into pretty-printed JSON text: a
 * top-level array of objects, indented with two spaces and without a trailing
 * newline (mirroring `exportCSV`).
 *
 * @example
 * ```typescript
 * exportJSON(["a"], [["1"]]);  // '[\n  {\n    "a": "1"\n  }\n]'
 * exportJSON(["a"], []);       // "[]"
 * ```
 */
export function exportJSON(headerRow: string[], bodyRows: string[][]): string {
  return JSON.stringify(rowsToJsonRecords(headerRow, bodyRows), null, 2);
}
