import type { DatasetMeta } from "./types";
import countryCodes from "./country-codes/meta";
import countryGdp from "./country-gdp/meta";
import countriesCapitals from "./countries-capitals/meta";
import usStateCapitals from "./us-state-capitals/meta";
import indianStates from "./indian-states/meta";
import sp500Companies from "./sp500-companies/meta";
import worldAirports from "./world-airports/meta";
import worldPopulation from "./world-population/meta";

export const datasets: DatasetMeta[] = [
  countriesCapitals,
  usStateCapitals,
  indianStates,
  countryCodes,
  worldPopulation,
  countryGdp,
  worldAirports,
  sp500Companies,
];

const bySlug = new Map(datasets.map((d) => [d.slug, d]));

export function getDatasetBySlug(slug: string): DatasetMeta | undefined {
  return bySlug.get(slug);
}
