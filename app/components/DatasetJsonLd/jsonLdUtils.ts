import type { DatasetMeta } from "@/lib/datasets/types";
import { BRAND_NAME, DATASET_LICENSE_URL } from "@/lib/brand";

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
 * `creator` and `license` describe the *compilation* CSV Preview publishes,
 * not the underlying facts (which come from mixed public sources and are not
 * copyrightable on their own): CSV Preview curates each CSV, and the result is
 * offered under `DATASET_LICENSE_URL` unless a dataset overrides it via
 * `meta.license`. Search Console reports both as recommended Dataset fields.
 *
 * Deliberately does NOT emit `distribution`/`contentUrl` — there is no raw-CSV
 * download route in this app.
 *
 * Pure and exported for unit testing.
 */
export function computeDatasetJsonLd(
  input: DatasetJsonLdInput,
): Record<string, unknown> {
  const { meta, path, baseUrl, columns } = input;
  const organization = {
    "@type": "Organization",
    name: BRAND_NAME,
    url: baseUrl,
  };

  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: meta.title,
    description: meta.description,
    url: new URL(path, baseUrl).toString(),
    identifier: meta.slug,
    dateModified: meta.lastModified,
    isAccessibleForFree: true,
    license: meta.license ?? DATASET_LICENSE_URL,
    creator: organization,
    publisher: organization,
    ...(meta.keywords && meta.keywords.length > 0
      ? { keywords: meta.keywords }
      : {}),
    ...(columns.length > 0 ? { variableMeasured: columns } : {}),
  };
}
