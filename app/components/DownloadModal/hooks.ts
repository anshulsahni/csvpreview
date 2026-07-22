"use client";

import { useState } from "react";
import { Keys, useKeyboardShortcuts } from "@/app/components/KeyboardShortcuts";

export interface DownloadOptions {
  filename: string;
}

export interface DownloadModalRenderProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFilename: string;
  onDownload: (options: DownloadOptions) => void;
}

export interface UseDownloadModalReturn {
  filename: string;
  canDownload: boolean;
  setFilename: (value: string) => void;
  handleBackdropClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleCardClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleCloseClick: () => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

/**
 * Builds the date-stamped default download filename, e.g.
 * `csvpreview-export-2026-05-31.csv`. Pure and deterministic so it can be
 * unit-tested with an injected date.
 */
export function computeDefaultFilename(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `csvpreview-export-${year}-${month}-${day}.csv`;
}

/** Ensures the user-entered filename ends with a single `.csv` suffix. */
export function ensureCsvExtension(filename: string): string {
  const trimmed = filename.trim();
  if (trimmed === "") {
    return computeDefaultFilename();
  }
  return trimmed.toLowerCase().endsWith(".csv") ? trimmed : `${trimmed}.csv`;
}

export function useDownloadModal({
  isOpen,
  onClose,
  defaultFilename,
  onDownload,
}: DownloadModalRenderProps): UseDownloadModalReturn {
  const [filename, setFilename] = useState(defaultFilename);

  // Plain functions: every handler below is wired only to a plain DOM element
  // (the backdrop <div>, the card <div>, the close <button>, the <form>). DOM
  // elements never memoize on prop identity, and nothing here is a hook
  // dependency, so useCallback would add cost and noise for no benefit.
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.currentTarget === event.target) {
      onClose();
    }
  };

  const handleCardClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const handleCloseClick = () => {
    onClose();
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onDownload({ filename: ensureCsvExtension(filename) });
  };

  useKeyboardShortcuts(
    { primaryKey: Keys.Escape },
    () => onClose(),
    [onClose],
    { enabled: isOpen }
  );

  return {
    filename,
    canDownload: filename.trim() !== "",
    setFilename,
    handleBackdropClick,
    handleCardClick,
    handleCloseClick,
    handleSubmit,
  };
}
