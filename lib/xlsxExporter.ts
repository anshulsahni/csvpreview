import type { SheetData } from "write-excel-file/browser";

/**
 * XLSX Exporter: turn parsed CSV data (2D string arrays) into a single `.xlsx`
 * workbook, one sheet per input CSV.
 *
 * Mirrors the shape of `csvExporter.ts` — pure, framework-agnostic helpers that
 * are easily unit-tested — with the one browser-only piece (the actual workbook
 * generation) isolated behind `csvSheetsToXlsxBlob`. `write-excel-file` is
 * loaded via a dynamic import so this module stays importable in a plain
 * Node/jest environment (its ESM browser build would otherwise fail to load).
 */

/** A single CSV file's contents destined to become one worksheet. */
export interface CsvSheet {
  /** Proposed worksheet name (typically the CSV file's base name). */
  name: string;
  /** Parsed rows as a 2D array of strings (from `parseCSV`). */
  rows: string[][];
}

const MAX_SHEET_NAME_LENGTH = 31;
// Characters Excel forbids in a worksheet name: \ / ? * [ ] :
const ILLEGAL_SHEET_NAME_CHARS = /[\\/?*[\]:]/g;

/**
 * Sanitize a single worksheet name to satisfy Excel's rules: strip forbidden
 * characters, collapse whitespace, cap at 31 characters, and never return an
 * empty string. Pure and deterministic.
 */
export function sanitizeSheetName(name: string): string {
  const cleaned = name
    .replace(ILLEGAL_SHEET_NAME_CHARS, " ")
    .replace(/\s+/g, " ")
    .trim();
  const truncated = cleaned.slice(0, MAX_SHEET_NAME_LENGTH);
  return truncated === "" ? "Sheet" : truncated;
}

/**
 * Sanitize a list of worksheet names and guarantee uniqueness (Excel treats
 * sheet names case-insensitively). Collisions get a ` (2)`, ` (3)`, … suffix,
 * trimmed so the result still fits within the 31-character limit. Pure.
 */
export function makeUniqueSheetNames(names: string[]): string[] {
  const used = new Set<string>();
  return names.map((raw) => {
    const base = sanitizeSheetName(raw);
    let candidate = base;
    let counter = 2;
    while (used.has(candidate.toLowerCase())) {
      const suffix = ` (${counter})`;
      candidate = `${base.slice(0, MAX_SHEET_NAME_LENGTH - suffix.length)}${suffix}`;
      counter += 1;
    }
    used.add(candidate.toLowerCase());
    return candidate;
  });
}

/** Convert one CSV's rows into `write-excel-file` sheet data. */
function toSheetData(rows: string[][]): SheetData {
  if (rows.length === 0) {
    // write-excel-file needs at least one row of data per sheet.
    return [[null]];
  }
  return rows.map((row) =>
    row.map((cell) => (cell === "" ? null : { value: cell, type: String }))
  );
}

/**
 * Build a single `.xlsx` workbook Blob from one or more CSV files, each mapped
 * to its own worksheet. Browser-only (dynamically imports the browser build of
 * `write-excel-file`).
 */
export async function csvSheetsToXlsxBlob(sheets: CsvSheet[]): Promise<Blob> {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  const sheetNames = makeUniqueSheetNames(sheets.map((sheet) => sheet.name));
  const workbook = sheets.map((sheet, index) => ({
    sheet: sheetNames[index],
    data: toSheetData(sheet.rows),
  }));
  return writeXlsxFile(workbook).toBlob();
}
