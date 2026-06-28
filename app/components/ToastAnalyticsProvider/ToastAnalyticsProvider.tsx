"use client";

import type { ReactNode } from "react";
import { ToastProvider, type ToastEvent } from "@/app/components/Toast";
import { track } from "@/lib/analytics";

/**
 * App-side adapter that plugs analytics into the otherwise dependency-free
 * Toast module via its `onEvent` callback. The Toast module itself never
 * imports analytics, keeping it portable / open-sourceable.
 */
function handleToastEvent(event: ToastEvent): void {
  if (event.type === "shown") {
    track("Toast Shown", { variant: event.toast.variant });
  } else {
    track("Toast Dismissed", {
      variant: event.toast.variant,
      reason: event.reason,
    });
  }
}

export default function ToastAnalyticsProvider({
  children,
}: {
  children: ReactNode;
}) {
  return <ToastProvider onEvent={handleToastEvent}>{children}</ToastProvider>;
}
