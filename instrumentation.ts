import { initServerErrorTracking } from "@/lib/errorTracking";

export function register(): void {
  // The app has no edge routes, so only the Node.js runtime needs Sentry.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    initServerErrorTracking();
  }
}

export { captureRequestError as onRequestError } from "@/lib/errorTracking";
