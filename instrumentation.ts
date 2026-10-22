import type { Instrumentation } from "next";
import { captureRequestError, initServerErrorTracking } from "@/lib/errorTracking";
import { logRequestError } from "@/lib/logger/requestLog";

export function register(): void {
  // The app has no edge routes, so only the Node.js runtime needs Sentry.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    initServerErrorTracking();
  }
}

/**
 * Next allows one `onRequestError`: report to Sentry, then write a log line.
 * Sentry goes first so a logging bug can never stop the report.
 */
export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  const reported = captureRequestError(error, request, context);
  logRequestError(error, request, context);
  return reported;
};
