import type { MetadataRoute } from "next";
import { datasets } from "@/lib/datasets";

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
  ];

  const datasetPages: MetadataRoute.Sitemap = datasets.map((ds) => ({
    url: `${BASE_URL}/data/${ds.slug}`,
  }));

  return [...staticPages, ...datasetPages];
}
