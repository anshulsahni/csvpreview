import type { DatasetMeta } from "./types";
import usStateCapitals from "./us-state-capitals/meta";

export const datasets: DatasetMeta[] = [usStateCapitals];

const bySlug = new Map(datasets.map((d) => [d.slug, d]));

export function getDatasetBySlug(slug: string): DatasetMeta | undefined {
  return bySlug.get(slug);
}
