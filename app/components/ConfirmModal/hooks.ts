"use client";

import { useCallback } from "react";
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

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.currentTarget === event.target) {
        onCancel();
      }
    },
    [onCancel]
  );

  const handleCardClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
    },
    []
  );

  return { handleBackdropClick, handleCardClick };
}
