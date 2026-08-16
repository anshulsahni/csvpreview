import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/brand";
import { datasets } from "@/lib/datasets";
import {
  categories,
  getCategoryPath,
  getDatasetPathBySlug,
} from "@/lib/datasets/categories";

export default function sitemap(): MetadataRoute.Sitemap {
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
      url: `${SITE_URL}/tools/excel-to-csv`,
      changeFrequency: "monthly"
    },
    {

      url: `${SITE_URL}/data`,
      changeFrequency: "weekly",
    },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE_URL}${getCategoryPath(c.slug)}`,
    changeFrequency: "weekly",
  }));

  const datasetPages: MetadataRoute.Sitemap = datasets.flatMap((ds) => {
    const path = getDatasetPathBySlug(ds.slug);
    return path ? [{ url: `${SITE_URL}${path}` }] : [];
  });

  return [...staticPages, ...categoryPages, ...datasetPages];
}
