import { zipSync, type Zippable } from "fflate";

/**
 * Bundle in-memory text files into a single `.zip` Blob.
 *
 * Self-contained on purpose: it depends only on `fflate` and Web APIs, with no
 * imports from the rest of the app, so it can be lifted out and reused as-is.
 */

/** One text file destined for the archive. */
export interface ZipEntry {
  /** File name inside the archive, e.g. `sales-Q1.csv`. */
  name: string;
  /** UTF-8 text contents. */
  content: string;
}

/**
 * Make every name in the list unique by appending ` (2)`, ` (3)`, … before the
 * extension. A zip archive with two identically named entries is ambiguous, and
 * two worksheets can easily produce the same CSV name. Pure.
 *
 * @example
 * ```typescript
 * dedupeEntryNames(["a.csv", "a.csv"]); // ["a.csv", "a (2).csv"]
 * ```
 */
export function dedupeEntryNames(names: string[]): string[] {
  const used = new Set<string>();
  return names.map((name) => {
    const dot = name.lastIndexOf(".");
    const base = dot > 0 ? name.slice(0, dot) : name;
    const extension = dot > 0 ? name.slice(dot) : "";
    let candidate = name;
    let counter = 2;
    while (used.has(candidate.toLowerCase())) {
      candidate = `${base} (${counter})${extension}`;
      counter += 1;
    }
    used.add(candidate.toLowerCase());
    return candidate;
  });
}

/**
 * Zip a set of text entries into a single Blob.
 *
 * Uses fflate's synchronous `zipSync`: the async variant is Web Worker-backed,
 * which makes it untestable under jsdom and adds a bundle for no benefit at our
 * sizes. The trade-off is that a very large archive blocks the main thread for
 * the duration of the compression — acceptable because zipping only ever
 * happens on an explicit "download all" click. Moving this to a Web Worker is
 * the obvious follow-up if users ever notice.
 */
export function filesToZipBlob(entries: ZipEntry[]): Blob {
  const encoder = new TextEncoder();
  const names = dedupeEntryNames(entries.map((entry) => entry.name));
  const zippable: Zippable = {};
  entries.forEach((entry, index) => {
    zippable[names[index]] = encoder.encode(entry.content);
  });
  return new Blob([zipSync(zippable)], { type: "application/zip" });
}
