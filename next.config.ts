import type { NextConfig } from "next";
import { withWyw } from "@wyw-in-js/nextjs";
// Loaded through Next's next.config.ts require hook, which SWC-transpiles each
// file it pulls in. Anything reachable from this import must therefore use
// relative imports only — `@/…` inside a transitively required file would be
// resolved from the repo root and mis-resolve. `lib/datasets/*` complies.
import { getLegacyDatasetRedirects } from "@/lib/datasets/categories";

const classNameSlug = "[title]-[hash]";

const nextConfig: NextConfig = {
  redirects() {
    // 301s from the flat `/data/{slug}` URLs to their category-nested paths.
    return getLegacyDatasetRedirects();
  },
};

export default withWyw(nextConfig, {
  loaderOptions: { classNameSlug },
  turbopackLoaderOptions: { classNameSlug },
});
