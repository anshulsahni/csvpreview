import { datasets } from "@/lib/datasets";
import {
  assertCategoryCompleteness,
  categories,
  getCategoryBySlug,
  getCategoryForDataset,
  getCategoryPath,
  getDatasetPath,
  getDatasetPathBySlug,
  getDatasetStaticParams,
  getDatasetsForCategory,
  getLegacyDatasetRedirects,
  getRelatedDatasets,
} from "@/lib/datasets/categories";

// Expected values are hardcoded fixtures at the bottom of this file — they are
// only read inside `it` bodies, which run after the module finishes evaluating.

describe("hardcoded expectations are self-consistent", () => {
  // Guards the fixtures themselves, so a typo there can't mask a regression.
  it("declares the stated number of categories and datasets", () => {
    expect(EXPECTED_CATEGORY_SLUGS).toHaveLength(CATEGORY_COUNT);
    expect(Object.keys(CATEGORY_NAMES)).toHaveLength(CATEGORY_COUNT);
    expect(EXPECTED_CATEGORY_DATASETS).toHaveLength(CATEGORY_COUNT);
    expect(DATASET_CATEGORY_PAIRS).toHaveLength(DATASET_COUNT);
    expect(new Set(DATASET_CATEGORY_PAIRS.map(([, slug]) => slug)).size).toBe(
      DATASET_COUNT,
    );
  });
});

describe("categories", () => {
  it("exposes exactly the 9 expected categories, in order", () => {
    expect(categories.map((c) => c.slug)).toEqual(EXPECTED_CATEGORY_SLUGS);
  });

  it("gives each category its expected display name", () => {
    expect(Object.fromEntries(categories.map((c) => [c.slug, c.name]))).toEqual(
      CATEGORY_NAMES,
    );
  });

  it("assigns exactly the expected datasets to each category, in order", () => {
    expect(categories.map((c) => [c.slug, c.datasetSlugs])).toEqual(
      EXPECTED_CATEGORY_DATASETS,
    );
  });

  it("registers exactly 43 datasets in lib/datasets", () => {
    expect(datasets).toHaveLength(DATASET_COUNT);
    expect(new Set(datasets.map((d) => d.slug))).toEqual(
      new Set(DATASET_CATEGORY_PAIRS.map(([, slug]) => slug)),
    );
  });

  it("passes its own completeness check", () => {
    expect(() => assertCategoryCompleteness()).not.toThrow();
  });

  it("keeps category slugs disjoint from dataset slugs", () => {
    // Both occupy the same path segment: /data/{category} vs /data/{slug}.
    const datasetSlugs = DATASET_CATEGORY_PAIRS.map(([, slug]) => slug);
    for (const categorySlug of EXPECTED_CATEGORY_SLUGS) {
      expect(datasetSlugs).not.toContain(categorySlug);
    }
  });
});

describe("path helpers", () => {
  it("builds a category path", () => {
    expect(getCategoryPath("geography")).toBe("/data/geography");
    expect(getCategoryPath("food-drink")).toBe("/data/food-drink");
  });

  it("builds a nested dataset path", () => {
    expect(getDatasetPath("geography", "countries-capitals")).toBe(
      "/data/geography/countries-capitals",
    );
    expect(getDatasetPath("architecture", "longest-bridges-tunnels")).toBe(
      "/data/architecture/longest-bridges-tunnels",
    );
  });

  it("resolves a dataset's path from its slug alone", () => {
    expect(getDatasetPathBySlug("countries-capitals")).toBe(
      "/data/geography/countries-capitals",
    );
    expect(getDatasetPathBySlug("indian-sweets")).toBe(
      "/data/food-drink/indian-sweets",
    );
    expect(getDatasetPathBySlug("periodic-table-elements")).toBe(
      "/data/science/periodic-table-elements",
    );
  });

  it("returns undefined for an unknown dataset slug", () => {
    expect(getDatasetPathBySlug("not-a-dataset")).toBeUndefined();
  });
});

describe("getDatasetStaticParams", () => {
  it("returns the expected 43 { category, slug } pairs, in order", () => {
    expect(getDatasetStaticParams()).toEqual(
      DATASET_CATEGORY_PAIRS.map(([category, slug]) => ({ category, slug })),
    );
  });

  it("spot-checks the first and last pair literally", () => {
    const params = getDatasetStaticParams();
    expect(params[0]).toEqual({
      category: "geography",
      slug: "countries-capitals",
    });
    expect(params[params.length - 1]).toEqual({
      category: "architecture",
      slug: "longest-bridges-tunnels",
    });
  });
});

describe("getLegacyDatasetRedirects", () => {
  it("maps every legacy flat URL to its expected nested path", () => {
    expect(getLegacyDatasetRedirects()).toEqual(
      DATASET_CATEGORY_PAIRS.map(([category, slug]) => ({
        source: `/data/${slug}`,
        destination: `/data/${category}/${slug}`,
        statusCode: 301,
      })),
    );
  });

  it("spot-checks representative redirects literally", () => {
    const redirects = getLegacyDatasetRedirects();
    expect(redirects).toContainEqual({
      source: "/data/countries-capitals",
      destination: "/data/geography/countries-capitals",
      statusCode: 301,
    });
    expect(redirects).toContainEqual({
      source: "/data/spices",
      destination: "/data/food-drink/spices",
      statusCode: 301,
    });
    expect(redirects).toContainEqual({
      source: "/data/longest-bridges-tunnels",
      destination: "/data/architecture/longest-bridges-tunnels",
      statusCode: 301,
    });
  });

  it("emits exactly 43 redirects with unique sources", () => {
    const redirects = getLegacyDatasetRedirects();
    expect(redirects).toHaveLength(DATASET_COUNT);
    expect(new Set(redirects.map((r) => r.source)).size).toBe(DATASET_COUNT);
  });

  it("uses a literal 301 and never Next's `permanent` flag", () => {
    // `statusCode` and `permanent` are mutually exclusive in Next's config.
    for (const redirect of getLegacyDatasetRedirects()) {
      expect(redirect.statusCode).toBe(301);
      expect(redirect).not.toHaveProperty("permanent");
    }
  });

  it("never shadows a category index page", () => {
    const categoryPaths = EXPECTED_CATEGORY_SLUGS.map((s) => `/data/${s}`);
    for (const redirect of getLegacyDatasetRedirects()) {
      expect(categoryPaths).not.toContain(redirect.source);
    }
  });

  it("never chains — no destination is also a source", () => {
    const redirects = getLegacyDatasetRedirects();
    const sources = redirects.map((r) => r.source);
    for (const redirect of redirects) {
      expect(sources).not.toContain(redirect.destination);
    }
  });

  it("keeps every source a literal single-segment path", () => {
    // A path-to-regexp special char (: * ? + ( ) { }) would silently turn a
    // source into a pattern and could match /data/{category} too.
    for (const redirect of getLegacyDatasetRedirects()) {
      expect(redirect.source).toMatch(/^\/data\/[a-z0-9-]+$/);
    }
  });
});

describe("getCategoryBySlug", () => {
  it("returns the category for a known slug", () => {
    expect(getCategoryBySlug("geography")?.name).toBe("Geography & Places");
    expect(getCategoryBySlug("language-culture")?.name).toBe(
      "Language & Culture",
    );
  });

  it("returns undefined for an unknown slug", () => {
    expect(getCategoryBySlug("not-a-category")).toBeUndefined();
  });
});

describe("getCategoryForDataset", () => {
  it("finds the category that owns a dataset", () => {
    expect(getCategoryForDataset("countries-capitals")?.slug).toBe("geography");
    expect(getCategoryForDataset("busiest-airports")?.slug).toBe("transport");
    expect(getCategoryForDataset("dog-breeds")?.slug).toBe("animals-nature");
  });

  it("returns undefined for an unknown dataset slug", () => {
    expect(getCategoryForDataset("not-a-dataset")).toBeUndefined();
  });
});

describe("getDatasetsForCategory", () => {
  it("resolves dataset metadata in the declared order", () => {
    expect(getDatasetsForCategory("architecture").map((d) => d.slug)).toEqual([
      "tallest-buildings-world",
      "longest-bridges-tunnels",
    ]);
    expect(getDatasetsForCategory("economics").map((d) => d.slug)).toEqual([
      "country-gdp",
      "sp500-companies",
      "currency-codes",
      "g20-g7-brics-members",
    ]);
  });

  it("returns an empty array for an unknown category", () => {
    expect(getDatasetsForCategory("not-a-category")).toEqual([]);
  });
});

describe("getRelatedDatasets", () => {
  it("returns the expected same-category datasets, excluding the source", () => {
    expect(getRelatedDatasets("countries-capitals").map((d) => d.slug)).toEqual([
      "us-state-capitals",
      "indian-states",
      "country-codes",
      "world-population",
      "world-timezones",
    ]);
  });

  it("caps results at max", () => {
    expect(
      getRelatedDatasets("countries-capitals", 3).map((d) => d.slug),
    ).toEqual(["us-state-capitals", "indian-states", "country-codes"]);
  });

  it("returns fewer than max when the category is small", () => {
    expect(
      getRelatedDatasets("tallest-buildings-world", 5).map((d) => d.slug),
    ).toEqual(["longest-bridges-tunnels"]);
  });

  it("returns an empty array for an unknown dataset slug", () => {
    expect(getRelatedDatasets("not-a-dataset")).toEqual([]);
  });
});

/* ────────────────────────────────────────────────────────────────────────────
 * Expected values
 *
 * Nothing below is derived from the code under test — these literals ARE the
 * spec. Every `/data/{category}/{slug}` URL is public and 301-mapped from a
 * legacy path, so an accidental taxonomy edit must fail loudly here rather than
 * silently move the expectation with it.
 *
 * If you intentionally add or recategorize a dataset, update these in the same
 * commit.
 * ──────────────────────────────────────────────────────────────────────────── */

const CATEGORY_COUNT = 9;
const DATASET_COUNT = 43;

const EXPECTED_CATEGORY_SLUGS = [
  "geography",
  "transport",
  "economics",
  "history",
  "food-drink",
  "animals-nature",
  "science",
  "language-culture",
  "architecture",
];

const CATEGORY_NAMES: Record<string, string> = {
  geography: "Geography & Places",
  transport: "Transport",
  economics: "Economics & Finance",
  history: "History & Politics",
  "food-drink": "Food & Drink",
  "animals-nature": "Animals & Nature",
  science: "Science",
  "language-culture": "Language & Culture",
  architecture: "Architecture",
};

/** [category slug, its dataset slugs in declared order]. */
const EXPECTED_CATEGORY_DATASETS: [string, string[]][] = [
  [
    "geography",
    [
      "countries-capitals",
      "us-state-capitals",
      "indian-states",
      "country-codes",
      "world-population",
      "world-timezones",
      "mountain-heights",
      "world-rivers",
      "national-parks",
    ],
  ],
  [
    "transport",
    [
      "world-airports",
      "airline-codes",
      "busiest-airports",
      "high-speed-rail-networks",
      "metro-systems-world",
    ],
  ],
  [
    "economics",
    [
      "country-gdp",
      "sp500-companies",
      "currency-codes",
      "g20-g7-brics-members",
    ],
  ],
  [
    "history",
    [
      "us-presidents",
      "indian-prime-ministers",
      "uk-prime-ministers",
      "independence-days",
      "un-member-states",
    ],
  ],
  [
    "food-drink",
    [
      "world-cuisines",
      "top-crops-global",
      "coffee-producing-countries",
      "tea-varieties",
      "indian-sweets",
      "spices",
      "wine-regions",
      "calories-macros",
    ],
  ],
  [
    "animals-nature",
    [
      "dog-breeds",
      "cat-breeds",
      "endangered-species-iucn",
      "animal-species-lifespan-diet-habitat",
    ],
  ],
  [
    "science",
    [
      "human-body-organs-functions",
      "planets-moons-solar-system",
      "periodic-table-elements",
      "major-earthquakes-history",
    ],
  ],
  ["language-culture", ["most-spoken-languages", "indian-languages-by-state"]],
  ["architecture", ["tallest-buildings-world", "longest-bridges-tunnels"]],
];

/** [category slug, dataset slug], in taxonomy declaration order. */
const DATASET_CATEGORY_PAIRS: [string, string][] = [
  ["geography", "countries-capitals"],
  ["geography", "us-state-capitals"],
  ["geography", "indian-states"],
  ["geography", "country-codes"],
  ["geography", "world-population"],
  ["geography", "world-timezones"],
  ["geography", "mountain-heights"],
  ["geography", "world-rivers"],
  ["geography", "national-parks"],
  ["transport", "world-airports"],
  ["transport", "airline-codes"],
  ["transport", "busiest-airports"],
  ["transport", "high-speed-rail-networks"],
  ["transport", "metro-systems-world"],
  ["economics", "country-gdp"],
  ["economics", "sp500-companies"],
  ["economics", "currency-codes"],
  ["economics", "g20-g7-brics-members"],
  ["history", "us-presidents"],
  ["history", "indian-prime-ministers"],
  ["history", "uk-prime-ministers"],
  ["history", "independence-days"],
  ["history", "un-member-states"],
  ["food-drink", "world-cuisines"],
  ["food-drink", "top-crops-global"],
  ["food-drink", "coffee-producing-countries"],
  ["food-drink", "tea-varieties"],
  ["food-drink", "indian-sweets"],
  ["food-drink", "spices"],
  ["food-drink", "wine-regions"],
  ["food-drink", "calories-macros"],
  ["animals-nature", "dog-breeds"],
  ["animals-nature", "cat-breeds"],
  ["animals-nature", "endangered-species-iucn"],
  ["animals-nature", "animal-species-lifespan-diet-habitat"],
  ["science", "human-body-organs-functions"],
  ["science", "planets-moons-solar-system"],
  ["science", "periodic-table-elements"],
  ["science", "major-earthquakes-history"],
  ["language-culture", "most-spoken-languages"],
  ["language-culture", "indian-languages-by-state"],
  ["architecture", "tallest-buildings-world"],
  ["architecture", "longest-bridges-tunnels"],
];
