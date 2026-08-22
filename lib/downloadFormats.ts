/**
 * Download format registry: the formats the viewer can serialize a sheet into,
 * plus the filename-extension helpers that go with them.
 *
 * Pure, framework-agnostic and dependency-free — the single place that knows how
 * a format is labelled, what it is named on disk, and what MIME type its Blob
 * carries. New formats (TSV, pipe-separated, …) only need an entry here plus a
 * branch in the caller that produces the text.
 */

export type DownloadFormat = "csv" | "json";

export interface DownloadFormatSpec {
  /** Human-readable name, used in the download dialog's title. */
  label: string;
  /** Filename suffix, leading dot included. */
  extension: string;
  /** MIME type for the generated Blob. */
  mimeType: string;
}

export const DOWNLOAD_FORMATS: Record<DownloadFormat, DownloadFormatSpec> = {
  csv: {
    label: "CSV",
    extension: ".csv",
    mimeType: "text/csv;charset=utf-8",
  },
  json: {
    label: "JSON",
    extension: ".json",
    mimeType: "application/json;charset=utf-8",
  },
};

/**
 * Append `extension` unless `filename` already ends with it. The match is
 * case-insensitive and the original casing is preserved, so `people.CSV` is
 * left alone rather than becoming `people.CSV.csv`.
 *
 * @example
 * ```typescript
 * ensureExtension("people", ".csv");      // "people.csv"
 * ensureExtension("people.CSV", ".csv");  // "people.CSV"
 * ```
 */
export function ensureExtension(filename: string, extension: string): string {
  return filename.toLowerCase().endsWith(extension.toLowerCase())
    ? filename
    : `${filename}${extension}`;
}

/**
 * Remove a trailing `extension` from `filename` (case-insensitive). Used to
 * seed the download dialog's base-name input, where the extension is shown
 * separately and is not editable.
 *
 * @example
 * ```typescript
 * stripExtension("people.csv", ".csv");  // "people"
 * stripExtension("people", ".csv");      // "people"
 * ```
 */
export function stripExtension(filename: string, extension: string): string {
  return filename.toLowerCase().endsWith(extension.toLowerCase())
    ? filename.slice(0, filename.length - extension.length)
    : filename;
}
