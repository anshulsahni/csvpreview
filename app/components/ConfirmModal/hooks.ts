"use client";

import { Keys, useKeyboardShortcuts } from "@/app/components/KeyboardShortcuts";

export interface ConfirmModalRenderProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface UseConfirmModalReturn {
  handleBackdropClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleCardClick: (event: React.MouseEvent<HTMLDivElement>) => void;
}

const ESCAPE_SHORTCUT = { primaryKey: Keys.Escape };

export function useConfirmModal({
  isOpen,
  onCancel,
}: Pick<ConfirmModalRenderProps, "isOpen" | "onCancel">): UseConfirmModalReturn {
  useKeyboardShortcuts(ESCAPE_SHORTCUT, onCancel, [onCancel], {
    enabled: isOpen,
  });

  // Plain functions: both handlers are wired only to plain DOM <div>s, which
  // never memoize on prop identity, and neither is a hook dependency — so
  // useCallback would buy nothing here.
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.currentTarget === event.target) {
      onCancel();
    }
  };

  const handleCardClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return { handleBackdropClick, handleCardClick };
}
