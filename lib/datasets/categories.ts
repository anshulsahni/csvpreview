import type { DatasetMeta } from "./types";
import { datasets, getDatasetBySlug } from "./index";

export interface CategoryMeta {
  slug: string;
  name: string;
  blurb: string;
  datasetSlugs: string[];
}

export const categories: CategoryMeta[] = [
  {
    slug: "geography",
    name: "Geography & Places",
    blurb: "Countries, capitals, borders, populations and the physical world.",
    datasetSlugs: [
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
  },
  {
    slug: "transport",
    name: "Transport",
    blurb: "Airports, airlines, high-speed rail and metro networks worldwide.",
    datasetSlugs: [
      "world-airports",
      "airline-codes",
      "busiest-airports",
      "high-speed-rail-networks",
      "metro-systems-world",
    ],
  },
  {
    slug: "economics",
    name: "Economics & Finance",
    blurb: "GDP, public companies, currencies and the world's major trade blocs.",
    datasetSlugs: [
      "country-gdp",
      "sp500-companies",
      "currency-codes",
      "g20-g7-brics-members",
    ],
  },
  {
    slug: "history",
    name: "History & Politics",
    blurb: "Presidents, prime ministers, independence days and UN membership.",
    datasetSlugs: [
      "us-presidents",
      "indian-prime-ministers",
      "uk-prime-ministers",
      "independence-days",
      "un-member-states",
    ],
  },
  {
    slug: "food-drink",
    name: "Food & Drink",
    blurb: "Cuisines, crops, coffee, tea, sweets, spices, wine and nutrition data.",
    datasetSlugs: [
      "world-cuisines",
      "top-crops-global",
      "coffee-producing-countries",
      "tea-varieties",
      "indian-sweets",
      "spices",
      "wine-regions",
      "calories-macros",
    ],
  },
  {
    slug: "animals-nature",
    name: "Animals & Nature",
    blurb: "Dog and cat breeds, endangered species and animal life spans.",
    datasetSlugs: [
      "dog-breeds",
      "cat-breeds",
      "endangered-species-iucn",
      "animal-species-lifespan-diet-habitat",
    ],
  },
  {
    slug: "science",
    name: "Science",
    blurb: "The human body, the solar system, the periodic table and earthquakes.",
    datasetSlugs: [
      "human-body-organs-functions",
      "planets-moons-solar-system",
      "periodic-table-elements",
      "major-earthquakes-history",
    ],
  },
  {
    slug: "language-culture",
    name: "Language & Culture",
    blurb: "The world's most-spoken languages and India's languages by state.",
    datasetSlugs: ["most-spoken-languages", "indian-languages-by-state"],
  },
  {
    slug: "architecture",
    name: "Architecture",
    blurb: "The world's tallest buildings and longest bridges and tunnels.",
    datasetSlugs: ["tallest-buildings-world", "longest-bridges-tunnels"],
  },
];

const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));
const categoryByDatasetSlug = new Map(
  categories.flatMap((c) => c.datasetSlugs.map((slug) => [slug, c] as const)),
);

export function getCategoryBySlug(slug: string): CategoryMeta | undefined {
  return categoryBySlug.get(slug);
}

export function getCategoryForDataset(
  datasetSlug: string,
): CategoryMeta | undefined {
  return categoryByDatasetSlug.get(datasetSlug);
}

export function getDatasetsForCategory(categorySlug: string): DatasetMeta[] {
  const category = categoryBySlug.get(categorySlug);
  if (!category) return [];
  return category.datasetSlugs
    .map((slug) => getDatasetBySlug(slug))
    .filter((d): d is DatasetMeta => Boolean(d));
}

export function getRelatedDatasets(
  datasetSlug: string,
  max = 5,
): DatasetMeta[] {
  const category = categoryByDatasetSlug.get(datasetSlug);
  if (!category) return [];
  return category.datasetSlugs
    .filter((slug) => slug !== datasetSlug)
    .map((slug) => getDatasetBySlug(slug))
    .filter((d): d is DatasetMeta => Boolean(d))
    .slice(0, max);
}

/** Canonical path for a category index page. */
export function getCategoryPath(categorySlug: string): string {
  return `/data/${categorySlug}`;
}

/** Canonical path for a dataset page, nested under its category. */
export function getDatasetPath(
  categorySlug: string,
  datasetSlug: string,
): string {
  return `/data/${categorySlug}/${datasetSlug}`;
}

/**
 * Canonical dataset path resolved from the taxonomy.
 * Returns undefined when the slug isn't assigned to a category.
 */
export function getDatasetPathBySlug(datasetSlug: string): string | undefined {
  const category = categoryByDatasetSlug.get(datasetSlug);
  return category ? getDatasetPath(category.slug, datasetSlug) : undefined;
}

/**
 * `{ category, slug }` pairs for every dataset, feeding `generateStaticParams`
 * on the nested `/data/[category]/[slug]` route.
 */
export function getDatasetStaticParams(): {
  category: string;
  slug: string;
}[] {
  return categories.flatMap((category) =>
    category.datasetSlugs.map((slug) => ({ category: category.slug, slug })),
  );
}

/** A 301 from a legacy flat `/data/{slug}` URL to its category-nested path. */
export interface LegacyDatasetRedirect {
  source: string;
  destination: string;
  statusCode: 301;
}

/**
 * Redirects for the flat dataset URLs that shipped before datasets were nested
 * under their category. Derived from the taxonomy so the slug → category
 * mapping stays single-sourced. Consumed by `next.config.ts`.
 *
 * Sources are deliberately literal single-segment paths, never patterns — a
 * pattern like `/data/:slug` would also match `/data/{category}` and loop.
 */
export function getLegacyDatasetRedirects(): LegacyDatasetRedirect[] {
  return categories.flatMap((category) =>
    category.datasetSlugs.map(
      (datasetSlug): LegacyDatasetRedirect => ({
        source: `/data/${datasetSlug}`,
        destination: getDatasetPath(category.slug, datasetSlug),
        statusCode: 301,
      }),
    ),
  );
}

export function assertCategoryCompleteness(): void {
  const allDatasetSlugs = new Set(datasets.map((d) => d.slug));
  const categorizedSlugs = new Set(categories.flatMap((c) => c.datasetSlugs));

  for (const slug of allDatasetSlugs) {
    if (!categorizedSlugs.has(slug)) {
      throw new Error(`Dataset "${slug}" is not assigned to any category.`);
    }
  }
  for (const slug of categorizedSlugs) {
    if (!allDatasetSlugs.has(slug)) {
      throw new Error(`Category references unknown dataset slug "${slug}".`);
    }
  }
  // Categories and datasets share a single path segment under /data, so a
  // collision would make /data/{slug} ambiguous between the two routes.
  for (const category of categories) {
    if (allDatasetSlugs.has(category.slug)) {
      throw new Error(
        `Category slug "${category.slug}" collides with a dataset slug; ` +
          `/data/${category.slug} would be ambiguous.`,
      );
    }
  }
}
