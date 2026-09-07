import type { Delimiter } from "./csvParser";

/**
 * Download format registry: the formats the viewer can serialize a sheet into,
 * plus the filename-extension helpers that go with them.
 *
 * Pure, framework-agnostic and dependency-free — the single place that knows how
 * a format is labelled, what it is named on disk, what MIME type its Blob
 * carries and, for the delimited text formats, which separator joins its cells.
 * Adding a format should be a one-file change: an entry here plus its key in
 * `SECONDARY_DOWNLOAD_FORMATS`.
 */

export type DownloadFormat = "csv" | "json" | "tsv" | "psv" | "ssv";

export interface DownloadFormatSpec {
  /** Human-readable name, used in the download dialog's title and menu entry. */
  label: string;
  /** Filename suffix, leading dot included. */
  extension: string;
  /** MIME type for the generated Blob. */
  mimeType: string;
  /**
   * Field separator for delimited text formats. Its **absence** is what marks a
   * format as non-delimited (JSON), so callers branch on `delimiter === undefined`
   * rather than on the format key — no `switch` grows as formats are added.
   */
  delimiter?: Delimiter;
}

export const DOWNLOAD_FORMATS: Record<DownloadFormat, DownloadFormatSpec> = {
  csv: {
    label: "CSV",
    extension: ".csv",
    mimeType: "text/csv;charset=utf-8",
    delimiter: ",",
  },
  json: {
    label: "JSON",
    extension: ".json",
    mimeType: "application/json;charset=utf-8",
  },
  tsv: {
    label: "TSV",
    extension: ".tsv",
    mimeType: "text/tab-separated-values;charset=utf-8",
    delimiter: "\t",
  },
  psv: {
    label: "Pipe-separated",
    extension: ".psv",
    mimeType: "text/plain;charset=utf-8",
    delimiter: "|",
  },
  ssv: {
    label: "Space-separated",
    // No `.ssv` convention exists, and `.txt` is what other tools expect for a
    // space-separated dump — so this is the one format whose extension does not
    // echo its key.
    extension: ".txt",
    mimeType: "text/plain;charset=utf-8",
    delimiter: " ",
  },
};

/**
 * The formats offered in the download dropdown, in menu order — every format
 * except `csv`, which the split button's primary action already covers.
 */
export const SECONDARY_DOWNLOAD_FORMATS: DownloadFormat[] = [
  "json",
  "tsv",
  "psv",
  "ssv",
];

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
