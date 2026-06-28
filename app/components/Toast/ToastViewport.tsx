"use client";

import { styled } from "@linaria/react";
import ToastItem from "./ToastItem";
import type { Toast, ToastDismissReason } from "./types";

export interface ToastViewportProps {
  toasts: Toast[];
  onDismiss: (id: string, reason: ToastDismissReason) => void;
}

export default function ToastViewport({
  toasts,
  onDismiss,
}: ToastViewportProps) {
  if (toasts.length === 0) return null;

  return (
    <Region aria-live="polite" aria-relevant="additions">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </Region>
  );
}

const Region = styled.div`
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  /* Let clicks fall through the empty gaps; individual toasts opt back in. */
  pointer-events: none;
  max-width: min(360px, calc(100vw - 2rem));
`;
