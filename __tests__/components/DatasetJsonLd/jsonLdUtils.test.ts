import { computeDatasetJsonLd } from "@/app/components/DatasetJsonLd/jsonLdUtils";
import { BRAND_NAME } from "@/lib/brand";
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

  it("never emits license, distribution, contentUrl, or creator", () => {
    const jsonLd = computeDatasetJsonLd({
      meta: baseMeta,
      path: "/data/geography/world-population",
      baseUrl: "https://csvpreview.com",
      columns: ["country", "population"],
    });

    expect(jsonLd).not.toHaveProperty("license");
    expect(jsonLd).not.toHaveProperty("distribution");
    expect(jsonLd).not.toHaveProperty("contentUrl");
    expect(jsonLd).not.toHaveProperty("creator");
  });
});
