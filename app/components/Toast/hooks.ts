"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { v4 as uuidv4 } from "uuid";
import type {
  Toast,
  ToastContextValue,
  ToastDismissReason,
  ToastEvent,
  ToastOptions,
  ToastVariant,
} from "./types";

export const DEFAULT_DURATION_MS = 5000;
const DEFAULT_VARIANT: ToastVariant = "info";

export const ToastContext = createContext<ToastContextValue | null>(null);

/** Pure helper — resolve the effective variant for a toast request. */
export function resolveVariant(options?: ToastOptions): ToastVariant {
  return options?.variant ?? DEFAULT_VARIANT;
}

/** Pure helper — resolve the effective auto-dismiss duration for a request. */
export function resolveDuration(options?: ToastOptions): number {
  return options?.durationMs ?? DEFAULT_DURATION_MS;
}

export interface ToastController {
  toasts: Toast[];
  showToast: (message: string, options?: ToastOptions) => string;
  success: (message: string, options?: Omit<ToastOptions, "variant">) => string;
  error: (message: string, options?: Omit<ToastOptions, "variant">) => string;
  dismiss: (id: string, reason: ToastDismissReason) => void;
}

/**
 * Owns the toast queue, tab-visibility gating, and lifecycle event emission.
 * Knows nothing about analytics — events are forwarded to the optional
 * `onEvent` callback so the host app can wire in whatever it likes.
 */
export function useToastProvider(
  onEvent?: (event: ToastEvent) => void
): ToastController {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Mirror of `toasts` kept in sync so callbacks can read the latest value
  // without re-subscribing and without emitting from inside a state updater.
  const toastsRef = useRef<Toast[]>([]);
  // Toasts requested while the tab was hidden, held until the user returns.
  const pendingRef = useRef<Toast[]>([]);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const emit = useCallback((event: ToastEvent) => {
    onEventRef.current?.(event);
  }, []);

  const commit = useCallback(
    (toast: Toast) => {
      toastsRef.current = [...toastsRef.current, toast];
      setToasts(toastsRef.current);
      emit({ type: "shown", toast });
    },
    [emit]
  );

  const showToast = useCallback(
    (message: string, options?: ToastOptions): string => {
      const toast: Toast = {
        id: uuidv4(),
        message,
        variant: resolveVariant(options),
        durationMs: resolveDuration(options),
      };

      // Tab-away guard: if the tab is hidden, hold the toast until the user
      // comes back so they never miss the feedback.
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        pendingRef.current.push(toast);
      } else {
        commit(toast);
      }

      return toast.id;
    },
    [commit]
  );

  const success = useCallback(
    (message: string, options?: Omit<ToastOptions, "variant">) =>
      showToast(message, { ...options, variant: "success" }),
    [showToast]
  );

  const error = useCallback(
    (message: string, options?: Omit<ToastOptions, "variant">) =>
      showToast(message, { ...options, variant: "error" }),
    [showToast]
  );

  const dismiss = useCallback(
    (id: string, reason: ToastDismissReason) => {
      // Drop it from the pending queue too, in case it was never shown.
      pendingRef.current = pendingRef.current.filter((t) => t.id !== id);

      const target = toastsRef.current.find((t) => t.id === id);
      if (!target) return;

      toastsRef.current = toastsRef.current.filter((t) => t.id !== id);
      setToasts(toastsRef.current);
      emit({ type: "dismissed", toast: target, reason });
    },
    [emit]
  );

  // Flush any queued toasts when the user returns to the tab.
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState !== "visible") return;
      const queued = pendingRef.current;
      pendingRef.current = [];
      queued.forEach(commit);
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [commit]);

  return { toasts, showToast, success, error, dismiss };
}

/** Consumer hook — imperatively trigger toasts from anywhere in the tree. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
