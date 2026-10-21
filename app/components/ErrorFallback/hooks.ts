"use client";

import { useEffect } from "react";
import { captureError } from "@/lib/errorTracking";

/**
 * Report an error caught by a Next.js error boundary, once per error.
 * Uncaught errors are reported by the SDK's global handlers, but errors that
 * an `error.tsx` boundary catches never reach them, so we report them here.
 */
export function useReportError(error: Error): void {
  useEffect(() => {
    captureError(error);
  }, [error]);
}
