"use client";

import { useCallback, useState } from "react";
import { Keys, useKeyboardShortcuts } from "@/app/components/KeyboardShortcuts";
import {
  DOWNLOAD_FORMATS,
  SECONDARY_DOWNLOAD_FORMATS,
  type DownloadFormat,
} from "@/lib/downloadFormats";

const ESCAPE_SHORTCUT = { primaryKey: Keys.Escape };

/** Shown as a tooltip on the JSON entry while it cannot be used. */
export const JSON_DISABLED_REASON =
  'Enable "First row as header" to download JSON';

/** Which rows an extra menu entry covers. */
export type DownloadScope = "all" | "selected";

export interface DownloadOption {
  label: string;
  scope: DownloadScope;
}

/** One entry in the dropdown's format section. */
export interface DownloadFormatOption {
  format: DownloadFormat;
  label: string;
  /** Set only while the format cannot be used — feeds the entry's `title`. */
  disabledReason?: string;
}

export interface UseDownloadControlArgs {
  hasActiveFilter: boolean;
  selectedRowCount: number;
  /** JSON needs a header row to key its objects by. */
  canDownloadJson: boolean;
  onDownloadAll: () => void;
  onDownloadSelected: () => void;
  onDownloadFormat: (format: DownloadFormat) => void;
}

export interface UseDownloadControlReturn {
  isMenuOpen: boolean;
  primaryLabel: string;
  extraOptions: DownloadOption[];
  formatOptions: DownloadFormatOption[];
  toggleMenu: () => void;
  handleBlur: (event: React.FocusEvent<HTMLElement>) => void;
  handleOptionClick: (scope: DownloadScope) => void;
  handleFormatClick: (option: DownloadFormatOption) => void;
}

/**
 * Label for the primary button. It downloads the rows currently on screen, so
 * it says so when a filter is narrowing them.
 *
 * Pure and exported for unit testing.
 */
export function computePrimaryDownloadLabel(hasActiveFilter: boolean): string {
  return hasActiveFilter ? "Download filtered rows" : "Download";
}

/**
 * The scope entries that join the dropdown, most general first. Only scopes
 * that differ from what the primary button already does are offered.
 *
 * Pure and exported for unit testing.
 */
export function computeExtraDownloadOptions(
  hasActiveFilter: boolean,
  selectedRowCount: number
): DownloadOption[] {
  const options: DownloadOption[] = [];
  if (hasActiveFilter) {
    options.push({ label: "Download all rows", scope: "all" });
  }
  if (selectedRowCount > 0) {
    options.push({
      label: `Download selected ${
        selectedRowCount === 1 ? "row" : "rows"
      } (${selectedRowCount})`,
      scope: "selected",
    });
  }
  return options;
}

/**
 * The format section of the dropdown, in registry order. Every secondary format
 * is always listed — a format the sheet cannot currently produce is shown with
 * a reason rather than hidden, so the option never silently disappears.
 *
 * Only JSON is conditional: it keys its objects by the header row, so it needs
 * one. The delimited formats never do.
 *
 * Pure and exported for unit testing.
 */
export function computeDownloadFormatOptions(
  canDownloadJson: boolean
): DownloadFormatOption[] {
  return SECONDARY_DOWNLOAD_FORMATS.map((format) => ({
    format,
    label: `Download as ${DOWNLOAD_FORMATS[format].label}`,
    ...(format === "json" && !canDownloadJson
      ? { disabledReason: JSON_DISABLED_REASON }
      : {}),
  }));
}

/**
 * Behavior for the download split button: menu open state, the derived option
 * list, and the handlers that close the menu before running an action.
 */
export function useDownloadControl({
  hasActiveFilter,
  selectedRowCount,
  canDownloadJson,
  onDownloadAll,
  onDownloadSelected,
  onDownloadFormat,
}: UseDownloadControlArgs): UseDownloadControlReturn {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useKeyboardShortcuts(ESCAPE_SHORTCUT, () => setIsMenuOpen(false), [], {
    enabled: isMenuOpen,
  });

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  // Closing on blur rather than a document listener keeps the caret's own
  // click free to toggle the menu shut.
  const handleBlur = useCallback((event: React.FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsMenuOpen(false);
    }
  }, []);

  const handleOptionClick = useCallback(
    (scope: DownloadScope) => {
      setIsMenuOpen(false);
      if (scope === "all") {
        onDownloadAll();
      } else {
        onDownloadSelected();
      }
    },
    [onDownloadAll, onDownloadSelected]
  );

  const handleFormatClick = useCallback(
    (option: DownloadFormatOption) => {
      // An unavailable entry stays focusable so its tooltip can explain why,
      // which means the guard has to live here — and the menu stays open so the
      // explanation remains reachable.
      if (option.disabledReason !== undefined) return;
      setIsMenuOpen(false);
      onDownloadFormat(option.format);
    },
    [onDownloadFormat]
  );

  return {
    isMenuOpen,
    primaryLabel: computePrimaryDownloadLabel(hasActiveFilter),
    extraOptions: computeExtraDownloadOptions(hasActiveFilter, selectedRowCount),
    formatOptions: computeDownloadFormatOptions(canDownloadJson),
    toggleMenu,
    handleBlur,
    handleOptionClick,
    handleFormatClick,
  };
}
