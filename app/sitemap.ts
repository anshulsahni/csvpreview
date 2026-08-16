import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/brand";
import { datasets } from "@/lib/datasets";
import type { DatasetMeta } from "@/lib/datasets/types";
import {
  categories,
  getCategoryPath,
  getDatasetPathBySlug,
  getDatasetsForCategory,
} from "@/lib/datasets/categories";

/**
 * Latest `lastModified` among the given datasets, as a plain string
 * comparison — safe because every value is a YYYY-MM-DD date, which sorts
 * lexicographically the same as chronologically.
 */
function maxLastModified(datasetList: DatasetMeta[]): string | undefined {
  return datasetList.reduce<string | undefined>(
    (max, ds) => (!max || ds.lastModified > max ? ds.lastModified : max),
    undefined,
  );
}

export default function sitemap(): MetadataRoute.Sitemap {
  const hubLastModified = maxLastModified(datasets);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      changeFrequency: "daily",
    },
    {
      url: `${SITE_URL}/about`,
      changeFrequency: "daily",
    },
    {
      url: `${SITE_URL}/tools/csv-to-excel`,
      changeFrequency: "monthly",
    },
    {
      url: `${SITE_URL}/data`,
      changeFrequency: "weekly",
      ...(hubLastModified ? { lastModified: hubLastModified } : {}),
    },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => {
    const categoryLastModified = maxLastModified(getDatasetsForCategory(c.slug));
    return {
      url: `${SITE_URL}${getCategoryPath(c.slug)}`,
      changeFrequency: "weekly",
      ...(categoryLastModified ? { lastModified: categoryLastModified } : {}),
    };
  });

  const datasetPages: MetadataRoute.Sitemap = datasets.flatMap((ds) => {
    const path = getDatasetPathBySlug(ds.slug);
    return path
      ? [{ url: `${SITE_URL}${path}`, lastModified: ds.lastModified }]
      : [];
  });

  return [...staticPages, ...categoryPages, ...datasetPages];
}
