import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
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

const wywConfig = withWyw(nextConfig, {
  loaderOptions: { classNameSlug },
  turbopackLoaderOptions: { classNameSlug },
});

export default withSentryConfig(wywConfig, {
  // `SENTRY_ORG`, `SENTRY_PROJECT` and `SENTRY_AUTH_TOKEN` come from the
  // environment. Without the token (local dev, forks) source maps are not
  // uploaded and the build still passes.
  silent: !process.env.CI,
  telemetry: false,
  // Send events through our own domain so ad blockers don't drop them.
  // A fixed, neutral path: "/monitoring" is on common block lists.
  tunnelRoute: "/relay",
  // Upload source maps for readable stack traces, then delete them so they
  // are never served publicly.
  sourcemaps: { deleteSourcemapsAfterUpload: true },
  // A failed upload fails the build. Otherwise the maps are deleted anyway and
  // errors from that release can never be read. Builds without a token skip
  // the upload, so this does not affect local builds or forks.
  errorHandler(error) {
    console.warn("Sentry source map upload failed:", error);
    throw error;
  },
  // Tracing and Replay are not used, so drop their code from the bundle.
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeTracing: true,
    excludeReplayIframe: true,
    excludeReplayShadowDom: true,
    excludeReplayWorker: true,
  },
});
