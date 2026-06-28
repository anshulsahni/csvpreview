"use client";

import { useEffect, useRef, useState } from "react";
import { styled } from "@linaria/react";
import type { Toast, ToastDismissReason } from "./types";

export interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string, reason: ToastDismissReason) => void;
}

export default function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [paused, setPaused] = useState(false);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    // durationMs <= 0 => sticky (dismiss only on user action).
    // While paused (pointer over the toast) we skip arming the timer; leaving
    // the toast re-arms it, resuming the countdown.
    if (toast.durationMs <= 0 || paused) return;

    const timer = setTimeout(() => {
      onDismissRef.current(toast.id, "auto");
    }, toast.durationMs);

    return () => clearTimeout(timer);
  }, [toast.id, toast.durationMs, paused]);

  return (
    <Item
      data-variant={toast.variant}
      role={toast.variant === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <Message>{toast.message}</Message>
      <CloseButton
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id, "manual")}
      >
        ×
      </CloseButton>
    </Item>
  );
}

const Item = styled.div`
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 220px;
  padding: 0.6rem 0.6rem 0.6rem 0.9rem;
  border-radius: 8px;
  background: var(--background);
  color: var(--foreground);
  border: 1px solid var(--info, #0070f3);
  box-shadow: var(--dropdown-shadow, 0 8px 24px rgba(0, 0, 0, 0.18));
  font-size: 0.85rem;
  line-height: 1.3;
  animation: toastSlideIn 0.22s ease;

  &[data-variant="success"] {
    border-color: var(--success, #16a34a);
  }

  &[data-variant="error"] {
    border-color: var(--error, #dc2626);
  }

  &[data-variant="info"] {
    border-color: var(--info, #0070f3);
  }

  @keyframes toastSlideIn {
    from {
      opacity: 0;
      transform: translateY(1rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const Message = styled.span`
  flex: 1;
  word-break: break-word;
`;

const CloseButton = styled.button`
  flex-shrink: 0;
  background: transparent;
  border: none;
  color: var(--foreground);
  opacity: 0.6;
  font-size: 1.1rem;
  line-height: 1;
  padding: 0 0.25rem;
  cursor: pointer;

  &:hover {
    opacity: 1;
  }
`;
