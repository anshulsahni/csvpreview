"use client";

import {
  useEffect,
  useState,
  type ChangeEvent,
  type DragEvent,
  type MouseEvent,
} from "react";
import { Keys, useKeyboardShortcuts } from "@/app/components/KeyboardShortcuts";
import { ModifierKeys } from "@/app/components/KeyboardShortcuts/keys";
import type { ParseError } from "@/lib/csvParser";
import { detectUploadFormat } from "@/lib/uploadFormats";

export interface UseUploadModalArgs {
  isOpen: boolean;
  onClose: () => void;
  onFilePicked: (file: File) => void;
  onPasteSubmit: (text: string) => void;
  onStartBlank: () => void;
  pasteAreaElement?: HTMLTextAreaElement | null;
}

export interface UseUploadModalReturn {
  pastedText: string;
  isDragging: boolean;
  fileRejectionMessage: string | null;

  setPastedText: (text: string) => void;
  handleDragEnter: (event: DragEvent) => void;
  handleDragOver: (event: DragEvent) => void;
  handleDragLeave: (event: DragEvent) => void;
  handleDrop: (event: DragEvent) => void;
  handleFileInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  submitPastedText: () => void;
  handleBackdropClick: (event: MouseEvent) => void;
  handleCardClick: (event: MouseEvent) => void;
  handleStartBlankClick: () => void;
  handleCloseClick: () => void;
}

const UNSUPPORTED_FILE_MESSAGE = "Only .csv and .json files are accepted";
const SUBMIT_PASTE_SHORTCUT = {
  primaryKey: Keys.Enter,
  modifierKey: {
    mac: ModifierKeys.Meta,
    windows: ModifierKeys.Ctrl,
  },
};
const SUBMIT_PASTE_ALTERNATE_SHORTCUT = {
  primaryKey: Keys.Enter,
  modifierKey: {
    mac: ModifierKeys.Ctrl,
    windows: ModifierKeys.Meta,
  },
};

/**
 * Render one parse error for the error panel.
 *
 * Not every error is tied to a line: JSON shape errors are located by JSON path
 * instead, and "No data found" / "Could not read file" / "Paste area is empty"
 * are not located at all. Those carry `line: 0`, and a `Line 0:` prefix reads
 * like a bug, so it is dropped.
 *
 * Pure and exported for unit testing.
 *
 * @example
 * ```typescript
 * formatParseError({ line: 3, message: "bad quote" });  // "Line 3: bad quote"
 * formatParseError({ line: 0, message: "No data found" });  // "No data found"
 * ```
 */
export function formatParseError(error: ParseError): string {
  return error.line > 0 ? `Line ${error.line}: ${error.message}` : error.message;
}

export function useUploadModal(args: UseUploadModalArgs): UseUploadModalReturn {
  const {
    isOpen,
    onClose,
    onFilePicked,
    onPasteSubmit,
    onStartBlank,
    pasteAreaElement = null,
  } = args;

  const [pastedText, setPastedText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [fileRejectionMessage, setFileRejectionMessage] = useState<string | null>(null);

  useKeyboardShortcuts(
    { primaryKey: Keys.Escape },
    () => onClose(),
    [onClose],
    { enabled: isOpen }
  );

  const handlePasteSubmitShortcut = (event: KeyboardEvent) => {
    if (
      !pasteAreaElement ||
      (event.target !== pasteAreaElement &&
        document.activeElement !== pasteAreaElement)
    ) {
      return;
    }
    event.preventDefault();
    submitPastedText();
  };

  useKeyboardShortcuts(
    SUBMIT_PASTE_SHORTCUT,
    handlePasteSubmitShortcut,
    [handlePasteSubmitShortcut],
    { enabled: isOpen, allowInEditable: true }
  );
  useKeyboardShortcuts(
    SUBMIT_PASTE_ALTERNATE_SHORTCUT,
    handlePasteSubmitShortcut,
    [handlePasteSubmitShortcut],
    { enabled: isOpen, allowInEditable: true }
  );

  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPastedText("");
      setIsDragging(false);
      setFileRejectionMessage(null);
    }
  }, [isOpen]);

  function validateAndSubmitFile(file: File | undefined | null) {
    if (!file) return;
    if (detectUploadFormat(file.name, file.type) === null) {
      setFileRejectionMessage(UNSUPPORTED_FILE_MESSAGE);
      return;
    }
    setFileRejectionMessage(null);
    onFilePicked(file);
  }

  function handleDragEnter(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const file = event.dataTransfer?.files?.[0];
    validateAndSubmitFile(file);
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    validateAndSubmitFile(file);
    // Clear the input so picking the same file twice in a row re-triggers onChange.
    event.target.value = "";
  }

  function submitPastedText() {
    if (pastedText.trim() === "") return;
    onPasteSubmit(pastedText);
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target !== event.currentTarget) return;
    onClose();
  }

  function handleCardClick(event: MouseEvent) {
    event.stopPropagation();
  }

  function handleStartBlankClick() {
    onStartBlank();
  }

  function handleCloseClick() {
    onClose();
  }

  return {
    pastedText,
    isDragging,
    fileRejectionMessage,
    setPastedText,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange,
    submitPastedText,
    handleBackdropClick,
    handleCardClick,
    handleStartBlankClick,
    handleCloseClick,
  };
}
