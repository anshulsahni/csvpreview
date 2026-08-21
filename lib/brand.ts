import type { Metadata } from "next";

/** Canonical production origin, without a trailing slash. */
export const SITE_URL = "https://csvpreview.com";

/** Static paths under `public/brand/`. */
export const BRAND = {
  mark128: "/brand/mark-128.png",
  mark512: "/brand/mark-512.png",
  logo1024: "/brand/logo-1024.png",
} as const;

export const BRAND_NAME = "CSV Preview";

/** Default Open Graph / Twitter preview image (1024×1024). */
export const brandOpenGraphImages: NonNullable<Metadata["openGraph"]>["images"] = [
  { url: BRAND.logo1024, width: 1024, height: 1024, alt: BRAND_NAME },
];

/**
 * License that applies to the dataset compilations published under `/data`.
 *
 * The underlying facts come from public sources and are not themselves
 * copyrightable; what CSV Preview publishes is the curated compilation, and
 * that compilation is offered under CC BY 4.0. Individual datasets whose
 * upstream terms require a different license override this via
 * `DatasetMeta.license`.
 */
export const DATASET_LICENSE_URL = "https://creativecommons.org/licenses/by/4.0/";
