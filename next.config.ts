import type { NextConfig } from "next";
import { withWyw } from "@wyw-in-js/nextjs";

const classNameSlug = "[title]-[hash]";

const nextConfig: NextConfig = {};

export default withWyw(nextConfig, {
  loaderOptions: { classNameSlug },
  turbopackLoaderOptions: { classNameSlug },
});
