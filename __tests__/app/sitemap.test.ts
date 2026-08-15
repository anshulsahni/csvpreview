import sitemap from "@/app/sitemap";

// Expected values are hardcoded fixtures at the bottom of this file — they are
// only read inside `it` bodies, which run after the module finishes evaluating.

const getEntries = () => sitemap();
const getUrls = () => sitemap().map((entry) => entry.url);

describe("hardcoded expectations are self-consistent", () => {
  // Guards the fixtures themselves, so a typo there can't mask a regression.
  it("declares the stated number of URLs, with no duplicates", () => {
    expect(EXPECTED_STATIC_URLS).toHaveLength(STATIC_PAGE_COUNT);
    expect(EXPECTED_CATEGORY_URLS).toHaveLength(CATEGORY_PAGE_COUNT);
    expect(EXPECTED_DATASET_URLS).toHaveLength(DATASET_PAGE_COUNT);
    expect(LEGACY_FLAT_URLS).toHaveLength(DATASET_PAGE_COUNT);
    expect(STATIC_PAGE_COUNT + CATEGORY_PAGE_COUNT + DATASET_PAGE_COUNT).toBe(
      TOTAL_URL_COUNT,
    );
    expect(new Set(ALL_EXPECTED_URLS).size).toBe(TOTAL_URL_COUNT);
  });
});

describe("sitemap", () => {
  it("emits exactly the 56 expected URLs, in the expected order", () => {
    expect(getUrls()).toEqual(ALL_EXPECTED_URLS);
  });

  it("emits 56 URLs with no duplicates", () => {
    const urls = getUrls();
    expect(urls).toHaveLength(TOTAL_URL_COUNT);
    expect(new Set(urls).size).toBe(TOTAL_URL_COUNT);
  });

  it("includes the hub, every category index, and a nested dataset page", () => {
    const urls = getUrls();
    expect(urls).toContain("https://csvpreview.com/data");
    expect(urls).toContain("https://csvpreview.com/data/geography");
    expect(urls).toContain("https://csvpreview.com/data/architecture");
    expect(urls).toContain(
      "https://csvpreview.com/data/geography/countries-capitals",
    );
    expect(urls).toContain(
      "https://csvpreview.com/data/architecture/longest-bridges-tunnels",
    );
  });

  it("emits no legacy flat dataset URL", () => {
    // Legacy URLs 301 elsewhere; listing them would waste crawl budget.
    const urls = getUrls();
    for (const legacyUrl of LEGACY_FLAT_URLS) {
      expect(urls).not.toContain(legacyUrl);
    }
  });

  it("no longer emits the /data/category/ prefix", () => {
    expect(getUrls().filter((url) => url.includes("/data/category/"))).toEqual(
      [],
    );
  });

  it("nests every dataset URL exactly two segments under /data", () => {
    const datasetUrls = getUrls().filter(
      (url) =>
        url.startsWith("https://csvpreview.com/data/") &&
        url.split("/").length === 6,
    );
    expect(datasetUrls).toHaveLength(DATASET_PAGE_COUNT);
    for (const url of datasetUrls) {
      expect(url).toMatch(
        /^https:\/\/csvpreview\.com\/data\/[a-z-]+\/[a-z0-9-]+$/,
      );
    }
  });

  it("sets the expected changeFrequency on static and category pages", () => {
    const entries = getEntries();
    expect(entries.slice(0, STATIC_PAGE_COUNT)).toEqual(
      EXPECTED_STATIC_ENTRIES,
    );
    for (const entry of entries.slice(
      STATIC_PAGE_COUNT,
      STATIC_PAGE_COUNT + CATEGORY_PAGE_COUNT,
    )) {
      expect(entry.changeFrequency).toBe("weekly");
    }
  });

  it("leaves changeFrequency unset on dataset pages", () => {
    for (const entry of getEntries().slice(
      STATIC_PAGE_COUNT + CATEGORY_PAGE_COUNT,
    )) {
      expect(entry.changeFrequency).toBeUndefined();
    }
  });
});

/* ────────────────────────────────────────────────────────────────────────────
 * Expected values
 *
 * Nothing below is derived from the code under test. The sitemap is what search
 * engines crawl, so its exact contents are pinned: a URL silently appearing,
 * disappearing, or changing shape must fail here.
 *
 * Order is meaningful and asserted: 4 static pages, then the 9 category indexes
 * in taxonomy order, then the 43 datasets in `lib/datasets` REGISTRATION order
 * (not category order).
 * ──────────────────────────────────────────────────────────────────────────── */

const STATIC_PAGE_COUNT = 4;
const CATEGORY_PAGE_COUNT = 9;
const DATASET_PAGE_COUNT = 43;
const TOTAL_URL_COUNT = 56;

const EXPECTED_STATIC_ENTRIES = [
  { url: "https://csvpreview.com", changeFrequency: "daily" },
  { url: "https://csvpreview.com/about", changeFrequency: "daily" },
  {
    url: "https://csvpreview.com/tools/csv-to-excel",
    changeFrequency: "monthly",
  },
  { url: "https://csvpreview.com/data", changeFrequency: "weekly" },
];

const EXPECTED_STATIC_URLS = [
  "https://csvpreview.com",
  "https://csvpreview.com/about",
  "https://csvpreview.com/tools/csv-to-excel",
  "https://csvpreview.com/data",
];

const EXPECTED_CATEGORY_URLS = [
  "https://csvpreview.com/data/geography",
  "https://csvpreview.com/data/transport",
  "https://csvpreview.com/data/economics",
  "https://csvpreview.com/data/history",
  "https://csvpreview.com/data/food-drink",
  "https://csvpreview.com/data/animals-nature",
  "https://csvpreview.com/data/science",
  "https://csvpreview.com/data/language-culture",
  "https://csvpreview.com/data/architecture",
];

const EXPECTED_DATASET_URLS = [
  "https://csvpreview.com/data/geography/countries-capitals",
  "https://csvpreview.com/data/geography/us-state-capitals",
  "https://csvpreview.com/data/geography/indian-states",
  "https://csvpreview.com/data/geography/country-codes",
  "https://csvpreview.com/data/geography/world-population",
  "https://csvpreview.com/data/economics/country-gdp",
  "https://csvpreview.com/data/transport/world-airports",
  "https://csvpreview.com/data/economics/sp500-companies",
  "https://csvpreview.com/data/geography/mountain-heights",
  "https://csvpreview.com/data/geography/world-rivers",
  "https://csvpreview.com/data/economics/currency-codes",
  "https://csvpreview.com/data/geography/national-parks",
  "https://csvpreview.com/data/geography/world-timezones",
  "https://csvpreview.com/data/animals-nature/dog-breeds",
  "https://csvpreview.com/data/animals-nature/cat-breeds",
  "https://csvpreview.com/data/language-culture/most-spoken-languages",
  "https://csvpreview.com/data/language-culture/indian-languages-by-state",
  "https://csvpreview.com/data/history/us-presidents",
  "https://csvpreview.com/data/history/indian-prime-ministers",
  "https://csvpreview.com/data/history/uk-prime-ministers",
  "https://csvpreview.com/data/history/independence-days",
  "https://csvpreview.com/data/history/un-member-states",
  "https://csvpreview.com/data/economics/g20-g7-brics-members",
  "https://csvpreview.com/data/transport/airline-codes",
  "https://csvpreview.com/data/transport/busiest-airports",
  "https://csvpreview.com/data/transport/high-speed-rail-networks",
  "https://csvpreview.com/data/transport/metro-systems-world",
  "https://csvpreview.com/data/food-drink/world-cuisines",
  "https://csvpreview.com/data/food-drink/top-crops-global",
  "https://csvpreview.com/data/food-drink/coffee-producing-countries",
  "https://csvpreview.com/data/food-drink/tea-varieties",
  "https://csvpreview.com/data/food-drink/indian-sweets",
  "https://csvpreview.com/data/food-drink/spices",
  "https://csvpreview.com/data/food-drink/wine-regions",
  "https://csvpreview.com/data/food-drink/calories-macros",
  "https://csvpreview.com/data/science/human-body-organs-functions",
  "https://csvpreview.com/data/architecture/tallest-buildings-world",
  "https://csvpreview.com/data/science/major-earthquakes-history",
  "https://csvpreview.com/data/science/planets-moons-solar-system",
  "https://csvpreview.com/data/animals-nature/endangered-species-iucn",
  "https://csvpreview.com/data/animals-nature/animal-species-lifespan-diet-habitat",
  "https://csvpreview.com/data/science/periodic-table-elements",
  "https://csvpreview.com/data/architecture/longest-bridges-tunnels",
];

const ALL_EXPECTED_URLS = [
  ...EXPECTED_STATIC_URLS,
  ...EXPECTED_CATEGORY_URLS,
  ...EXPECTED_DATASET_URLS,
];

/** Every legacy flat URL that must NOT appear (each 301s to a nested path). */
const LEGACY_FLAT_URLS = [
  "https://csvpreview.com/data/countries-capitals",
  "https://csvpreview.com/data/us-state-capitals",
  "https://csvpreview.com/data/indian-states",
  "https://csvpreview.com/data/country-codes",
  "https://csvpreview.com/data/world-population",
  "https://csvpreview.com/data/country-gdp",
  "https://csvpreview.com/data/world-airports",
  "https://csvpreview.com/data/sp500-companies",
  "https://csvpreview.com/data/mountain-heights",
  "https://csvpreview.com/data/world-rivers",
  "https://csvpreview.com/data/currency-codes",
  "https://csvpreview.com/data/national-parks",
  "https://csvpreview.com/data/world-timezones",
  "https://csvpreview.com/data/dog-breeds",
  "https://csvpreview.com/data/cat-breeds",
  "https://csvpreview.com/data/most-spoken-languages",
  "https://csvpreview.com/data/indian-languages-by-state",
  "https://csvpreview.com/data/us-presidents",
  "https://csvpreview.com/data/indian-prime-ministers",
  "https://csvpreview.com/data/uk-prime-ministers",
  "https://csvpreview.com/data/independence-days",
  "https://csvpreview.com/data/un-member-states",
  "https://csvpreview.com/data/g20-g7-brics-members",
  "https://csvpreview.com/data/airline-codes",
  "https://csvpreview.com/data/busiest-airports",
  "https://csvpreview.com/data/high-speed-rail-networks",
  "https://csvpreview.com/data/metro-systems-world",
  "https://csvpreview.com/data/world-cuisines",
  "https://csvpreview.com/data/top-crops-global",
  "https://csvpreview.com/data/coffee-producing-countries",
  "https://csvpreview.com/data/tea-varieties",
  "https://csvpreview.com/data/indian-sweets",
  "https://csvpreview.com/data/spices",
  "https://csvpreview.com/data/wine-regions",
  "https://csvpreview.com/data/calories-macros",
  "https://csvpreview.com/data/human-body-organs-functions",
  "https://csvpreview.com/data/tallest-buildings-world",
  "https://csvpreview.com/data/major-earthquakes-history",
  "https://csvpreview.com/data/planets-moons-solar-system",
  "https://csvpreview.com/data/endangered-species-iucn",
  "https://csvpreview.com/data/animal-species-lifespan-diet-habitat",
  "https://csvpreview.com/data/periodic-table-elements",
  "https://csvpreview.com/data/longest-bridges-tunnels",
];
