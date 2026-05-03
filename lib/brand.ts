import type { Metadata } from "next";

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
