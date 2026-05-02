import type { DatasetMeta } from "./types";
import usStateCapitals from "./us-state-capitals/meta";
import indianStates from "./indian-states/meta";
import worldPopulation from "./world-population/meta";

export const datasets: DatasetMeta[] = [usStateCapitals, indianStates, worldPopulation];

const bySlug = new Map(datasets.map((d) => [d.slug, d]));

export function getDatasetBySlug(slug: string): DatasetMeta | undefined {
  return bySlug.get(slug);
}
