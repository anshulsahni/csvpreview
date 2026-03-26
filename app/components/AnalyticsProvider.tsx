"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  initMixpanel,
  trackPageView,
  trackButtonClick,
  trackLinkClick,
} from "@/lib/analytics";

/**
 * AnalyticsProvider
 *
 * Drop this component anywhere in the React tree (typically the root layout).
 * It handles three responsibilities:
 *
 *  1. Initialise Mixpanel once on first render.
 *  2. Fire a page-view event on every client-side navigation (uses the
 *     Mixpanel SDK's built-in track_pageview so all standard properties
 *     — url, title, referrer — are captured out of the box).
 *  3. Automatically capture button and link clicks via a single delegated
 *     listener on the document, so individual components never need to
 *     wire up tracking manually.
 */
export default function AnalyticsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // --- 1. Initialise once -------------------------------------------------
  useEffect(() => {
    initMixpanel();
  }, []);

  // --- 2. Page-view on every navigation -----------------------------------
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  // --- 3. Global click delegation for buttons & links ---------------------
  useEffect(() => {
    function handleClick(event: MouseEvent): void {
      const target = event.target as HTMLElement;
      const page = window.location.pathname;

      // Walk up the DOM from the clicked element so clicks on children
      // (e.g. an icon inside a <button>) are still caught correctly.
      const button = target.closest("button");

      if (button) {
        trackButtonClick({
          label: button.textContent?.trim() ?? "",
          buttonId: button.id || undefined,
          page,
          // Preserve any explicit data-track-* attributes set by authors
          ...dataAttributes(button),
        });
        // Don't fall through to the link check even if the button is
        // nested inside an anchor (unusual but possible).
        return;
      }

      const link = target.closest("a");
      if (link) {
        const href = link.getAttribute("href") ?? "";
        trackLinkClick({
          label: link.textContent?.trim() ?? link.getAttribute("aria-label") ?? "",
          href,
          page,
          isExternal: /^https?:\/\//.test(href),
          ...dataAttributes(link),
        });
      }
    }

    // Capture phase so the event is seen before any component stops propagation.
    document.addEventListener("click", handleClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);

  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// Helper: extract data-track-* attributes into plain properties so authors
// can annotate elements like <button data-track-variant="primary"> and have
// those values automatically forwarded to Mixpanel.
// ---------------------------------------------------------------------------
function dataAttributes(el: Element): Record<string, string> {
  const result: Record<string, string> = {};
  for (const attr of Array.from(el.attributes)) {
    if (attr.name.startsWith("data-track-")) {
      // data-track-variant  →  variant
      const key = attr.name.slice("data-track-".length);
      result[key] = attr.value;
    }
  }
  return result;
}
