/**
 * Upload format registry: the formats the viewer can ingest, plus the detector
 * that decides which parser a picked file belongs to.
 *
 * Counterpart to `downloadFormats.ts`, and pure/dependency-free for the same
 * reason — it is the single place that knows the accepted extensions, so the
 * file input's `accept` attribute, the drag-and-drop gate and the parser
 * dispatch cannot drift apart.
 */

export type UploadFormat = "csv" | "json";

export interface UploadFormatSpec {
  /** Human-readable name, used in modal copy. */
  label: string;
  /** Filename suffix, leading dot included. */
  extension: string;
  /** MIME types a browser may report for this format. */
  mimeTypes: string[];
}

export const UPLOAD_FORMATS: Record<UploadFormat, UploadFormatSpec> = {
  csv: {
    label: "CSV",
    extension: ".csv",
    mimeTypes: ["text/csv"],
  },
  json: {
    label: "JSON",
    extension: ".json",
    mimeTypes: ["application/json", "text/json"],
  },
};

const UPLOAD_FORMAT_KEYS = Object.keys(UPLOAD_FORMATS) as UploadFormat[];

/**
 * The `accept` attribute for a file input that takes every supported format,
 * e.g. `".csv,.json"`. Derived from the registry so adding a format here is
 * enough to widen the picker.
 */
export const UPLOAD_ACCEPT_ATTRIBUTE = UPLOAD_FORMAT_KEYS.map(
  (format) => UPLOAD_FORMATS[format].extension
).join(",");

/**
 * Decide which format a file is, or `null` when it is not one we accept.
 *
 * The **extension wins over the MIME type**, and the MIME type is only a
 * fallback. Browsers and operating systems are unreliable here: a `.json` file
 * often arrives as `""` or `application/octet-stream`, and Windows has been
 * known to report `application/vnd.ms-excel` for `.csv`. A filename ending in
 * `.json` is unambiguous where `file.type` is not.
 *
 * The MIME fallback is kept so an extension-less file that the browser *did*
 * identify is still accepted, matching the previous CSV-only behaviour.
 *
 * @example
 * ```typescript
 * detectUploadFormat("people.JSON");                  // "json"
 * detectUploadFormat("data.txt", "text/csv");         // "csv"  (MIME fallback)
 * detectUploadFormat("data.json", "text/csv");        // "json" (extension wins)
 * detectUploadFormat("book.xlsx");                    // null
 * ```
 */
export function detectUploadFormat(
  fileName: string,
  mimeType?: string
): UploadFormat | null {
  const lowerName = fileName.toLowerCase();
  for (const format of UPLOAD_FORMAT_KEYS) {
    if (lowerName.endsWith(UPLOAD_FORMATS[format].extension)) return format;
  }
  if (mimeType) {
    // Some browsers append parameters, e.g. `text/csv;charset=utf-8`.
    const bareType = mimeType.split(";")[0].trim().toLowerCase();
    for (const format of UPLOAD_FORMAT_KEYS) {
      if (UPLOAD_FORMATS[format].mimeTypes.includes(bareType)) return format;
    }
  }
  return null;
}
