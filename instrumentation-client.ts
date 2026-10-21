import { initClientErrorTracking } from "@/lib/errorTracking";

// Runs before the app becomes interactive, so errors during hydration are
// caught too. A failure here must never break the app itself.
try {
  initClientErrorTracking();
} catch {
  // Error tracking is optional; ignore setup failures.
}
