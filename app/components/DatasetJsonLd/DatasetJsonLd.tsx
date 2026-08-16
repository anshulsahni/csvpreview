import type { DatasetMeta } from "@/lib/datasets/types";
import { computeDatasetJsonLd } from "./jsonLdUtils";

export interface DatasetJsonLdProps {
  meta: DatasetMeta;
  /** Site-relative path, e.g. "/data/geography/world-population". */
  path: string;
  baseUrl: string;
  /** CSV header names; may be empty. */
  columns: string[];
}

export default function DatasetJsonLd({
  meta,
  path,
  baseUrl,
  columns,
}: DatasetJsonLdProps) {
  const jsonLd = computeDatasetJsonLd({ meta, path, baseUrl, columns });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
