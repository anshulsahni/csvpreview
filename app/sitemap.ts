import type { MetadataRoute } from "next";
import { datasets } from "@/lib/datasets";
import { categories } from "@/lib/datasets/categories";

const BASE_URL = "https://csvpreview.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      changeFrequency: "daily",
    },
    {
      url: `${BASE_URL}/about`,
      changeFrequency: "daily",
    },
    {
      url: `${BASE_URL}/tools/csv-to-excel`,
      changeFrequency: "monthly",
    },
    {
      url: `${BASE_URL}/data`,
      changeFrequency: "weekly",
    },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${BASE_URL}/data/category/${c.slug}`,
    changeFrequency: "weekly",
  }));

  const datasetPages: MetadataRoute.Sitemap = datasets.map((ds) => ({
    url: `${BASE_URL}/data/${ds.slug}`,
  }));

  return [...staticPages, ...categoryPages, ...datasetPages];
}
