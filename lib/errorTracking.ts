import type { Instrumentation } from "next";
import * as Sentry from "@sentry/nextjs";
import { SITE_URL } from "@/lib/brand";
import {
  createRateLimiter,
  scrubBreadcrumb,
  scrubEvent,
} from "@/lib/errorScrubber";

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN ?? "";

/** Most events one page load may send, so an error loop can't burn the quota. */
const MAX_CLIENT_EVENTS_PER_PAGE = 10;
/** Most events one server instance may send per minute. */
const MAX_SERVER_EVENTS_PER_MINUTE = 30;

/**
 * Default integrations we remove in the browser:
 * - Console: turns `console.*` calls into breadcrumbs, which can hold data.
 * - BrowserSession: sends a session ping on every page load. We only want
 *   to talk to Sentry when something breaks.
 * - BrowserTracing: performance tracing is out of scope.
 * DOM (click and input) breadcrumbs are dropped by `scrubBreadcrumb`.
 */
const REMOVED_CLIENT_INTEGRATIONS = new Set([
  "Console",
  "BrowserSession",
  "BrowserTracing",
]);

let initialized = false;

/** Turn off every kind of data the SDK collects on its own. */
const dataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: false,
  httpBodies: [],
  urlQueryParams: false,
  stackFrameVariables: false,
} satisfies Sentry.BrowserOptions["dataCollection"];

/** Options shared by the browser and the server SDK. */
function sharedOptions(maxEvents: number, windowMs?: number) {
  const allow = createRateLimiter(maxEvents, windowMs);
  return {
    dsn: DSN,
    dataCollection,
    ignoreErrors: [
      /ResizeObserver loop/,
      /^Non-Error promise rejection captured/,
      /^Object captured as promise rejection/,
    ],
    beforeBreadcrumb: scrubBreadcrumb,
    beforeSend(event: Sentry.ErrorEvent): Sentry.ErrorEvent | null {
      if (!allow()) return null;
      return scrubEvent(event);
    },
  };
}

/**
 * Initialize Sentry in the browser. Does nothing when the DSN is not set,
 * so local dev and forks send no requests. Safe to call more than once.
 */
export function initClientErrorTracking(): void {
  if (initialized || !DSN) return;

  Sentry.init({
    ...sharedOptions(MAX_CLIENT_EVENTS_PER_PAGE),
    // Only report errors whose stack comes from our own scripts. This drops
    // errors from browser extensions and injected third-party code.
    allowUrls: [SITE_URL, /^https:\/\/[\w-]+\.vercel\.app/, /^http:\/\/localhost/],
    denyUrls: [/^(chrome|moz|safari(-web)?)-extension:\/\//],
    integrations: (defaults) =>
      defaults.filter((integration) => !REMOVED_CLIENT_INTEGRATIONS.has(integration.name)),
  });

  initialized = true;
}

/** Initialize Sentry on the Node.js server. Does nothing without a DSN. */
export function initServerErrorTracking(): void {
  if (initialized || !DSN) return;

  Sentry.init(sharedOptions(MAX_SERVER_EVENTS_PER_MINUTE, 60_000));

  initialized = true;
}

/** `onRequestError` hook for `instrumentation.ts`: reports server render errors. */
export const captureRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context,
) => {
  if (!initialized) return;
  Sentry.captureRequestError(error, request, context);
};

/**
 * Report an error caught by an error boundary. The single choke-point for
 * manual reports — never call `Sentry.captureException` directly.
 */
export function captureError(error: unknown): void {
  if (!initialized) return;
  Sentry.captureException(error);
}
