"use client";

import { useCallback, useState } from "react";
import { Keys, useKeyboardShortcuts } from "@/app/components/KeyboardShortcuts";
import {
  DOWNLOAD_FORMATS,
  ensureExtension,
  type DownloadFormat,
} from "@/lib/downloadFormats";

export interface DownloadOptions {
  /** Full filename, extension included. */
  filename: string;
  format: DownloadFormat;
}

export interface DownloadModalRenderProps {
  isOpen: boolean;
  /** Decides the dialog's title and the extension locked onto the filename. */
  format: DownloadFormat;
  onClose: () => void;
  /** Filename without its extension — the modal owns the suffix. */
  defaultBaseName: string;
  onDownload: (options: DownloadOptions) => void;
}

export interface UseDownloadModalReturn {
  title: string;
  baseName: string;
  extension: string;
  canDownload: boolean;
  setBaseName: (value: string) => void;
  handleBackdropClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleCardClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleCloseClick: () => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

/**
 * Builds the date-stamped default download filename without an extension, e.g.
 * `csvpreview-export-2026-05-31`. Pure and deterministic so it can be
 * unit-tested with an injected date.
 */
export function computeDefaultFilenameStem(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `csvpreview-export-${year}-${month}-${day}`;
}

/**
 * Builds the date-stamped default download filename, e.g.
 * `csvpreview-export-2026-05-31.csv`.
 */
export function computeDefaultFilename(date: Date = new Date()): string {
  return `${computeDefaultFilenameStem(date)}${DOWNLOAD_FORMATS.csv.extension}`;
}

/** Ensures the user-entered filename ends with a single `.csv` suffix. */
export function ensureCsvExtension(filename: string): string {
  const trimmed = filename.trim();
  if (trimmed === "") {
    return computeDefaultFilename();
  }
  return ensureExtension(trimmed, DOWNLOAD_FORMATS.csv.extension);
}

export function useDownloadModal({
  isOpen,
  format,
  onClose,
  defaultBaseName,
  onDownload,
}: DownloadModalRenderProps): UseDownloadModalReturn {
  const [baseName, setBaseName] = useState(defaultBaseName);
  const spec = DOWNLOAD_FORMATS[format];

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.currentTarget === event.target) {
        onClose();
      }
    },
    [onClose]
  );

  const handleCardClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
    },
    []
  );

  const handleCloseClick = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = baseName.trim();
      const stem = trimmed === "" ? computeDefaultFilenameStem() : trimmed;
      onDownload({
        filename: ensureExtension(stem, spec.extension),
        format,
      });
    },
    [baseName, format, onDownload, spec.extension]
  );

  useKeyboardShortcuts(
    { primaryKey: Keys.Escape },
    () => onClose(),
    [onClose],
    { enabled: isOpen }
  );

  return {
    title: `Download ${spec.label}`,
    baseName,
    extension: spec.extension,
    canDownload: baseName.trim() !== "",
    setBaseName,
    handleBackdropClick,
    handleCardClick,
    handleCloseClick,
    handleSubmit,
  };
}
