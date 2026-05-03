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
import worldTimezones from "./world-timezones/meta";
import dogBreeds from "./dog-breeds/meta";
import catBreeds from "./cat-breeds/meta";
import mostSpokenLanguages from "./most-spoken-languages/meta";
import indianLanguagesByState from "./indian-languages-by-state/meta";
import usPresidents from "./us-presidents/meta";
import indianPrimeMinisters from "./indian-prime-ministers/meta";
import ukPrimeMinisters from "./uk-prime-ministers/meta";
import independenceDays from "./independence-days/meta";
import unMemberStates from "./un-member-states/meta";
import g20G7BricsMembers from "./g20-g7-brics-members/meta";
import airlineCodes from "./airline-codes/meta";
import busiestAirports from "./busiest-airports/meta";
import highSpeedRailNetworks from "./high-speed-rail-networks/meta";
import metroSystemsWorld from "./metro-systems-world/meta";

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
  worldTimezones,
  dogBreeds,
  catBreeds,
  mostSpokenLanguages,
  indianLanguagesByState,
  usPresidents,
  indianPrimeMinisters,
  ukPrimeMinisters,
  independenceDays,
  unMemberStates,
  g20G7BricsMembers,
  airlineCodes,
  busiestAirports,
  highSpeedRailNetworks,
  metroSystemsWorld,
];

const bySlug = new Map(datasets.map((d) => [d.slug, d]));

export function getDatasetBySlug(slug: string): DatasetMeta | undefined {
  return bySlug.get(slug);
}
