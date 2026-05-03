import type { DatasetMeta } from "./types";
import countryCodes from "./country-codes/meta";
import countryGdp from "./country-gdp/meta";
import countriesCapitals from "./countries-capitals/meta";
import usStateCapitals from "./us-state-capitals/meta";
import indianStates from "./indian-states/meta";
import sp500Companies from "./sp500-companies/meta";
import worldAirports from "./world-airports/meta";
import worldPopulation from "./world-population/meta";
import mountainHeights from "./mountain-heights/meta";
import worldRivers from "./world-rivers/meta";
import currencyCodes from "./currency-codes/meta";
import nationalParks from "./national-parks/meta";

export const datasets: DatasetMeta[] = [
  countriesCapitals,
  usStateCapitals,
  indianStates,
  countryCodes,
  worldPopulation,
  countryGdp,
  worldAirports,
  sp500Companies,
  mountainHeights,
  worldRivers,
  currencyCodes,
  nationalParks,
];

const bySlug = new Map(datasets.map((d) => [d.slug, d]));

export function getDatasetBySlug(slug: string): DatasetMeta | undefined {
  return bySlug.get(slug);
}
