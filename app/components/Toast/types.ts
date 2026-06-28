import type { ReactNode } from "react";

export type ToastVariant = "success" | "error" | "info";

export type ToastDismissReason = "auto" | "manual";

export interface ToastOptions {
  /** Visual + semantic variant. Defaults to "info". */
  variant?: ToastVariant;
  /** Auto-dismiss delay in ms. Defaults to 5000; <= 0 means sticky. */
  durationMs?: number;
}

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  durationMs: number;
}

/**
 * Lifecycle events the host app can subscribe to (analytics, logging, etc.).
 * Kept generic and app-agnostic so the module stays dependency-free and can be
 * extracted into a standalone library.
 */
export type ToastEvent =
  | { type: "shown"; toast: Toast }
  | { type: "dismissed"; toast: Toast; reason: ToastDismissReason };

export interface ToastContextValue {
  toasts: Toast[];
  /** Show a toast; returns its generated id. */
  showToast: (message: string, options?: ToastOptions) => string;
  success: (message: string, options?: Omit<ToastOptions, "variant">) => string;
  error: (message: string, options?: Omit<ToastOptions, "variant">) => string;
  /** Dismiss a toast by id (treated as a manual dismissal). */
  dismissToast: (id: string) => void;
}

export interface ToastProviderProps {
  children: ReactNode;
  /** Optional sink for lifecycle events. The host app plugs analytics in here. */
  onEvent?: (event: ToastEvent) => void;
}
