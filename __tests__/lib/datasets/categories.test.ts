import { datasets } from "@/lib/datasets";
import {
  assertCategoryCompleteness,
  categories,
  getCategoryBySlug,
  getCategoryForDataset,
  getDatasetsForCategory,
  getRelatedDatasets,
} from "@/lib/datasets/categories";

describe("categories completeness", () => {
  it("assigns every dataset to exactly one category and vice versa", () => {
    expect(() => assertCategoryCompleteness()).not.toThrow();
  });

  it("has no dataset slug duplicated across categories", () => {
    const seen = new Set<string>();
    for (const category of categories) {
      for (const slug of category.datasetSlugs) {
        expect(seen.has(slug)).toBe(false);
        seen.add(slug);
      }
    }
    expect(seen.size).toBe(datasets.length);
  });
});

describe("getCategoryBySlug", () => {
  it("returns the category for a known slug", () => {
    expect(getCategoryBySlug("geography")?.name).toBe("Geography & Places");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getCategoryBySlug("not-a-category")).toBeUndefined();
  });
});

describe("getCategoryForDataset", () => {
  it("finds the category that owns a dataset", () => {
    expect(getCategoryForDataset("countries-capitals")?.slug).toBe(
      "geography",
    );
  });

  it("returns undefined for an unknown dataset slug", () => {
    expect(getCategoryForDataset("not-a-dataset")).toBeUndefined();
  });
});

describe("getDatasetsForCategory", () => {
  it("resolves dataset metadata in the declared order", () => {
    const result = getDatasetsForCategory("architecture");
    expect(result.map((d) => d.slug)).toEqual([
      "tallest-buildings-world",
      "longest-bridges-tunnels",
    ]);
  });

  it("returns an empty array for an unknown category", () => {
    expect(getDatasetsForCategory("not-a-category")).toEqual([]);
  });
});

describe("getRelatedDatasets", () => {
  it("excludes the source dataset and stays within its category", () => {
    const related = getRelatedDatasets("countries-capitals");
    expect(related.some((d) => d.slug === "countries-capitals")).toBe(false);
    expect(related.every((d) => getCategoryForDataset(d.slug)?.slug === "geography")).toBe(
      true,
    );
  });

  it("caps results at max and returns fewer when the category is small", () => {
    expect(getRelatedDatasets("tallest-buildings-world", 5)).toHaveLength(1);
    expect(getRelatedDatasets("countries-capitals", 3)).toHaveLength(3);
  });

  it("returns an empty array for an unknown dataset slug", () => {
    expect(getRelatedDatasets("not-a-dataset")).toEqual([]);
  });
});
