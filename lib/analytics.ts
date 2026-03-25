import mixpanel, { Dict } from "mixpanel-browser";

const TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN ?? "";

let initialized = false;

/**
 * Initialize Mixpanel once with the project token.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export function initMixpanel(): void {
  if (initialized || !TOKEN) return;

  mixpanel.init(TOKEN, {
    // Disable the SDK's automatic page-view tracking so we control it via
    // trackPageView() and can enrich events with SPA-aware path data.
    track_pageview: false,
    persistence: "localStorage",
  });

  initialized = true;
}

/**
 * Track a page view.  Uses Mixpanel's built-in track_pageview() under the
 * hood so all standard page-view properties (url, referrer, etc.) are
 * captured automatically.
 */
export function trackPageView(path: string): void {
  if (!initialized) return;
  mixpanel.track_pageview({ page: path });
}

/**
 * Low-level event tracker — the single choke-point through which every
 * analytics call passes so we can add global enrichment, toggle tracking
 * in test environments, or swap providers later without touching call sites.
 */
export function track(event: string, properties?: Dict): void {
  if (!initialized) return;
  mixpanel.track(event, properties);
}

// ---------------------------------------------------------------------------
// Semantic helpers — keep call sites readable and event names consistent
// ---------------------------------------------------------------------------

export interface ButtonClickProperties {
  label: string;
  buttonId?: string;
  page: string;
  [key: string]: unknown;
}

/** Track a button click with standardised property names. */
export function trackButtonClick(properties: ButtonClickProperties): void {
  track("Button Clicked", properties);
}

export interface LinkClickProperties {
  label: string;
  href: string;
  page: string;
  isExternal: boolean;
  [key: string]: unknown;
}

/** Track a link (anchor) click with standardised property names. */
export function trackLinkClick(properties: LinkClickProperties): void {
  track("Link Clicked", properties);
}
