"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

export interface UseUploadModalArgs {
  isOpen: boolean;
  onClose: () => void;
  onFilePicked: (file: File) => void;
  onPasteSubmit: (text: string) => void;
  onStartBlank: () => void;
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
  handlePasteKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  submitPastedText: () => void;
  handleBackdropClick: (event: MouseEvent) => void;
  handleCardClick: (event: MouseEvent) => void;
  handleStartBlankClick: () => void;
  handleCloseClick: () => void;
}

const NON_CSV_MESSAGE = "Only .csv files are accepted";

function isCsvFile(file: File): boolean {
  if (file.type === "text/csv") return true;
  return file.name.toLowerCase().endsWith(".csv");
}

export function useUploadModal(args: UseUploadModalArgs): UseUploadModalReturn {
  const { isOpen, onClose, onFilePicked, onPasteSubmit, onStartBlank } = args;

  const [pastedText, setPastedText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [fileRejectionMessage, setFileRejectionMessage] = useState<string | null>(null);

  // Stash latest callbacks in refs so the Escape-key effect does not re-subscribe
  // on every parent render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      setPastedText("");
      setIsDragging(false);
      setFileRejectionMessage(null);
      return;
    }

    function handleKeyDown(event: KeyboardEvent | globalThis.KeyboardEvent) {
      if ((event as globalThis.KeyboardEvent).key === "Escape") {
        onCloseRef.current();
      }
    }

    window.addEventListener("keydown", handleKeyDown as EventListener);
    return () => {
      window.removeEventListener("keydown", handleKeyDown as EventListener);
    };
  }, [isOpen]);

  function validateAndSubmitFile(file: File | undefined | null) {
    if (!file) return;
    if (!isCsvFile(file)) {
      setFileRejectionMessage(NON_CSV_MESSAGE);
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

  function handlePasteKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    const isSubmit = event.key === "Enter" && (event.ctrlKey || event.metaKey);
    if (!isSubmit) return;
    event.preventDefault();
    submitPastedText();
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
    handlePasteKeyDown,
    submitPastedText,
    handleBackdropClick,
    handleCardClick,
    handleStartBlankClick,
    handleCloseClick,
  };
}
