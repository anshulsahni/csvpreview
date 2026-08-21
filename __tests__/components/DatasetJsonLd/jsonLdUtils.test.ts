import { computeDatasetJsonLd } from "@/app/components/DatasetJsonLd/jsonLdUtils";
import { BRAND_NAME, DATASET_LICENSE_URL } from "@/lib/brand";
import type { DatasetMeta } from "@/lib/datasets/types";

const baseMeta: DatasetMeta = {
  slug: "world-population",
  title: "World Population by Country & Territory (CSV)",
  description: "Population data for every country and territory.",
  keywords: ["world population", "population by country"],
  firstRowAsHeader: true,
  lastModified: "2026-05-02",
};

describe("computeDatasetJsonLd", () => {
  it("builds the expected Dataset shape", () => {
    const jsonLd = computeDatasetJsonLd({
      meta: baseMeta,
      path: "/data/geography/world-population",
      baseUrl: "https://csvpreview.com",
      columns: ["country", "population"],
    });

    expect(jsonLd).toEqual({
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: baseMeta.title,
      description: baseMeta.description,
      url: "https://csvpreview.com/data/geography/world-population",
      identifier: "world-population",
      dateModified: "2026-05-02",
      isAccessibleForFree: true,
      license: DATASET_LICENSE_URL,
      creator: {
        "@type": "Organization",
        name: BRAND_NAME,
        url: "https://csvpreview.com",
      },
      publisher: {
        "@type": "Organization",
        name: BRAND_NAME,
        url: "https://csvpreview.com",
      },
      keywords: baseMeta.keywords,
      variableMeasured: ["country", "population"],
    });
  });

  it("builds an absolute URL from a site-relative path and baseUrl", () => {
    const jsonLd = computeDatasetJsonLd({
      meta: baseMeta,
      path: "/data/geography/world-population",
      baseUrl: "https://csvpreview.com",
      columns: [],
    });

    expect(jsonLd.url).toBe(
      "https://csvpreview.com/data/geography/world-population",
    );
  });

  it("omits the keywords key entirely when keywords is undefined", () => {
    const meta: DatasetMeta = { ...baseMeta, keywords: undefined };
    const jsonLd = computeDatasetJsonLd({
      meta,
      path: "/data/geography/world-population",
      baseUrl: "https://csvpreview.com",
      columns: ["country"],
    });

    expect(jsonLd).not.toHaveProperty("keywords");
  });

  it("omits the keywords key entirely when keywords is an empty array", () => {
    const meta: DatasetMeta = { ...baseMeta, keywords: [] };
    const jsonLd = computeDatasetJsonLd({
      meta,
      path: "/data/geography/world-population",
      baseUrl: "https://csvpreview.com",
      columns: ["country"],
    });

    expect(jsonLd).not.toHaveProperty("keywords");
  });

  it("omits the variableMeasured key entirely when columns is empty", () => {
    const jsonLd = computeDatasetJsonLd({
      meta: baseMeta,
      path: "/data/geography/world-population",
      baseUrl: "https://csvpreview.com",
      columns: [],
    });

    expect(jsonLd).not.toHaveProperty("variableMeasured");
  });

  it("falls back to the site-wide dataset license when meta.license is unset", () => {
    const jsonLd = computeDatasetJsonLd({
      meta: baseMeta,
      path: "/data/geography/world-population",
      baseUrl: "https://csvpreview.com",
      columns: ["country"],
    });

    expect(jsonLd.license).toBe(DATASET_LICENSE_URL);
  });

  it("prefers a per-dataset license over the site-wide one", () => {
    const meta: DatasetMeta = {
      ...baseMeta,
      license: "https://creativecommons.org/licenses/by-sa/4.0/",
    };
    const jsonLd = computeDatasetJsonLd({
      meta,
      path: "/data/geography/world-population",
      baseUrl: "https://csvpreview.com",
      columns: ["country"],
    });

    expect(jsonLd.license).toBe(
      "https://creativecommons.org/licenses/by-sa/4.0/",
    );
  });

  it("credits the brand as creator, using the given baseUrl", () => {
    const jsonLd = computeDatasetJsonLd({
      meta: baseMeta,
      path: "/data/geography/world-population",
      baseUrl: "https://staging.csvpreview.com",
      columns: [],
    });

    expect(jsonLd.creator).toEqual({
      "@type": "Organization",
      name: BRAND_NAME,
      url: "https://staging.csvpreview.com",
    });
  });

  it("never emits distribution or contentUrl", () => {
    const jsonLd = computeDatasetJsonLd({
      meta: baseMeta,
      path: "/data/geography/world-population",
      baseUrl: "https://csvpreview.com",
      columns: ["country", "population"],
    });

    expect(jsonLd).not.toHaveProperty("distribution");
    expect(jsonLd).not.toHaveProperty("contentUrl");
  });
});
