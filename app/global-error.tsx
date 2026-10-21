"use client";

import "./globals.css";
import ErrorFallback from "@/app/components/ErrorFallback";
import { BRAND_NAME } from "@/lib/brand";

// Replaces the root layout when it crashes, so it must render its own
// <html> and <body>.
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body>
        {/* `metadata` can't be exported here, so set the tab title directly. */}
        <title>{BRAND_NAME}</title>
        <ErrorFallback error={error} retry={retry} />
      </body>
    </html>
  );
}
