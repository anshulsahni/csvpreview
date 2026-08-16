import { unzipSync } from "fflate";
import { exportCSV } from "./csvExporter";

/**
 * XLSX Importer: the inverse of `xlsxExporter.ts` — read an `.xlsx` workbook
 * and turn its worksheets into CSV-shaped data (2D string arrays).
 *
 * Mirrors that module's shape: pure, framework-agnostic helpers up top with the
 * browser-only piece (`read-excel-file`, which spawns a Web Worker) isolated
 * behind a dynamic import, so this module stays importable in a plain
 * Node/jest environment.
 *
 * The reading is deliberately lazy in two stages: `peekSheetNames` inflates
 * only the workbook's index (a few kilobytes) so an upload never costs the
 * memory of a full parse, and `readSheetRows` parses a single worksheet on
 * demand when the user actually asks for it.
 */

/**
 * The cell types `read-excel-file` can hand back at runtime.
 *
 * The library's own `CellValue` declares `typeof Date` — the `Date`
 * constructor rather than a `Date` instance — which is a bug in its published
 * types. We cast its result to this union once, at the single boundary in
 * `readSheetRows`, so nothing downstream has to deal with it.
 */
export type XlsxCellValue = string | number | boolean | Date | null;

const WORKBOOK_XML_PATH = "xl/workbook.xml";

const XML_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

/** Decode the XML entities that can legally appear in a sheet name. Pure. */
function decodeXmlEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      return String.fromCodePoint(parseInt(entity.slice(2), 16));
    }
    if (entity.startsWith("#")) {
      return String.fromCodePoint(parseInt(entity.slice(1), 10));
    }
    return XML_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

/**
 * Pull the worksheet names, in workbook order, out of the raw `xl/workbook.xml`
 * of an `.xlsx` archive. Pure and browser-free so it can be unit-tested.
 *
 * @example
 * ```typescript
 * parseSheetNamesFromWorkbookXml('<sheets><sheet name="Q1"/></sheets>'); // ["Q1"]
 * ```
 */
export function parseSheetNamesFromWorkbookXml(xml: string): string[] {
  const names: string[] = [];
  const sheetTag = /<(?:\w+:)?sheet\b[^>]*?\sname="([^"]*)"/g;
  let match = sheetTag.exec(xml);
  while (match !== null) {
    names.push(decodeXmlEntities(match[1]));
    match = sheetTag.exec(xml);
  }
  return names;
}

/**
 * List the worksheet names of an `.xlsx` file without parsing any cell data.
 *
 * Only `xl/workbook.xml` is inflated (via fflate's `filter` option), which
 * keeps an upload cheap no matter how large the workbook is. The synchronous
 * `unzipSync` is used on purpose: fflate's async variants are Web Worker-backed
 * and cannot run under jsdom, and the workbook index is small enough that
 * blocking is not a concern.
 *
 * @throws when the file is not a readable zip or carries no workbook index.
 */
export async function peekSheetNames(file: File): Promise<string[]> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const unzipped = unzipSync(bytes, {
    filter: (entry) => entry.name === WORKBOOK_XML_PATH,
  });
  const workbookXml = unzipped[WORKBOOK_XML_PATH];
  if (workbookXml === undefined) {
    throw new Error("Not a valid .xlsx workbook");
  }
  return parseSheetNamesFromWorkbookXml(new TextDecoder().decode(workbookXml));
}

/**
 * Render one cell value as CSV text. Pure and deterministic.
 *
 * - `null`/`undefined` become an empty cell.
 * - Dates become `YYYY-MM-DD`, or a full ISO timestamp when a time is present.
 * - Booleans become `TRUE`/`FALSE`, matching how Excel displays them.
 * - Numbers are printed plainly — no currency symbol, no thousands separator.
 */
export function cellToString(value: XlsxCellValue | undefined): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    const iso = value.toISOString();
    // A date-only cell arrives at exactly midnight UTC; keep those short.
    return iso.endsWith("T00:00:00.000Z") ? iso.slice(0, 10) : iso;
  }
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return String(value);
}

/**
 * Read a single worksheet out of an `.xlsx` file as a 2D string array.
 *
 * Formula cells come back as the value Excel last computed and cached in the
 * file, not as the formula text. Browser-only: `read-excel-file` is loaded via
 * a dynamic import because its browser build spawns a Web Worker.
 *
 * @param sheetName Worksheet name as returned by `peekSheetNames`.
 */
export async function readSheetRows(
  file: File,
  sheetName: string
): Promise<string[][]> {
  const { readSheet } = await import("read-excel-file/browser");
  // Single cast at the library boundary — see `XlsxCellValue` above.
  const sheetData = await readSheet(file, sheetName);
  const rows = sheetData as unknown as XlsxCellValue[][];
  return rows.map((row) => row.map(cellToString));
}

/**
 * Serialize worksheet rows to CSV text using the app's shared RFC 4180
 * serializer, so the tool's output matches every other CSV this app produces.
 */
export function sheetRowsToCsv(rows: string[][]): string {
  return exportCSV(rows);
}
