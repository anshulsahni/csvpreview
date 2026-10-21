"use client";

import ErrorFallback from "@/app/components/ErrorFallback";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorFallback error={error} retry={retry} />;
}
