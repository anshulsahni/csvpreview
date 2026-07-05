/**
 * Trigger a browser download for an in-memory Blob.
 *
 * Generalizes the anchor-click idiom used across the app (previously inlined in
 * `CsvViewer/hooks.ts`). The MIME type comes from the Blob itself, so this works
 * for CSV text, `.xlsx` binaries, or anything else. Browser-only — relies on
 * `document` and `URL.createObjectURL`.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
