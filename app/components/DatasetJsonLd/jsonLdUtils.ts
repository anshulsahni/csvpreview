import type { DatasetMeta } from "@/lib/datasets/types";
import { BRAND_NAME } from "@/lib/brand";

export interface DatasetJsonLdInput {
  meta: DatasetMeta;
  /** Site-relative path, e.g. "/data/geography/world-population". */
  path: string;
  baseUrl: string;
  /** CSV header names; may be empty. */
  columns: string[];
}

/**
 * Build schema.org Dataset structured data for a dataset page.
 *
 * `keywords` and `variableMeasured` are omitted entirely when there is
 * nothing to report, rather than emitted as empty arrays.
 *
 * Deliberately does NOT emit `license` (the 43 datasets come from mixed
 * upstream sources and we cannot assert one), `distribution`/`contentUrl`
 * (there is no raw-CSV download route in this app), or `creator` (CSV
 * Preview publishes these pages but did not create the underlying data —
 * only `publisher` is accurate).
 *
 * Pure and exported for unit testing.
 */
export function computeDatasetJsonLd(
  input: DatasetJsonLdInput,
): Record<string, unknown> {
  const { meta, path, baseUrl, columns } = input;

  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: meta.title,
    description: meta.description,
    url: new URL(path, baseUrl).toString(),
    identifier: meta.slug,
    dateModified: meta.lastModified,
    isAccessibleForFree: true,
    publisher: {
      "@type": "Organization",
      name: BRAND_NAME,
      url: baseUrl,
    },
    ...(meta.keywords && meta.keywords.length > 0
      ? { keywords: meta.keywords }
      : {}),
    ...(columns.length > 0 ? { variableMeasured: columns } : {}),
  };
}
