"use client";

import { useMemo } from "react";
import { ToastContext, useToastProvider } from "./hooks";
import ToastViewport from "./ToastViewport";
import type { ToastContextValue, ToastProviderProps } from "./types";

export function ToastProvider({ children, onEvent }: ToastProviderProps) {
  const { toasts, showToast, success, error, dismiss } =
    useToastProvider(onEvent);

  const value = useMemo<ToastContextValue>(
    () => ({
      toasts,
      showToast,
      success,
      error,
      dismissToast: (id: string) => dismiss(id, "manual"),
    }),
    [toasts, showToast, success, error, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
