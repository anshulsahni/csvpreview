"use client";

import { useEffect, useState } from "react";
import {
  parseCSV,
  type Delimiter,
  type ParseError,
} from "@/lib/csvParser";

export const LS_KEY_DATA = "csvpreview_data";
export const LS_KEY_FILE_NAME = "csvpreview_filename";

const PASTED_FILENAME = "pasted.csv";

export interface UseCsvViewerReturn {
  csvData: string[][] | null;
  fileName: string;
  isUploadOpen: boolean;
  parseErrors: ParseError[];
  delimiter: Delimiter;
  firstRowAsHeader: boolean;
  setFirstRowAsHeader: (value: boolean) => void;

  openUpload: () => void;
  closeUpload: () => void;
  handleFilePicked: (file: File) => void;
  handlePasteSubmit: (text: string) => void;
  handleStartBlank: () => void;
  handleClear: () => void;
}

function readPersistedRows(): string[][] | null {
  try {
    const raw = localStorage.getItem(LS_KEY_DATA);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed as string[][];
  } catch {
    return null;
  }
}

export function useCsvViewer(): UseCsvViewerReturn {
  const [csvData, setCsvData] = useState<string[][] | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [parseErrors, setParseErrors] = useState<ParseError[]>([]);
  const [delimiter] = useState<Delimiter>(",");
  const [firstRowAsHeader, setFirstRowAsHeader] = useState(false);

  useEffect(() => {
    const persisted = readPersistedRows();
    if (persisted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCsvData(persisted);
      setFileName(localStorage.getItem(LS_KEY_FILE_NAME) ?? "");
    } else {
      setIsUploadOpen(true);
    }
  }, []);

  function ingest(text: string, name: string) {
    const { rows, errors } = parseCSV(text, { delimiter });
    if (errors.length > 0) {
      setParseErrors(errors);
      return;
    }
    setParseErrors([]);
    setCsvData(rows);
    setFileName(name);
    try {
      localStorage.setItem(LS_KEY_DATA, JSON.stringify(rows));
      localStorage.setItem(LS_KEY_FILE_NAME, name);
    } catch {
      // localStorage may be unavailable (privacy mode, quota). Non-fatal.
    }
    setIsUploadOpen(false);
  }

  function handleFilePicked(file: File) {
    const reader = new FileReader();
    reader.onload = function handleFileReaderLoad(event: ProgressEvent<FileReader>) {
      const text = (event.target?.result as string) ?? "";
      ingest(text, file.name);
    };
    reader.onerror = function handleFileReaderError() {
      setParseErrors([{ line: 0, message: "Could not read file" }]);
    };
    reader.readAsText(file);
  }

  function handlePasteSubmit(text: string) {
    if (text.trim() === "") {
      setParseErrors([{ line: 0, message: "Paste area is empty" }]);
      return;
    }
    ingest(text, PASTED_FILENAME);
  }

  function handleStartBlank() {
    setCsvData([]);
    setFileName("");
    setParseErrors([]);
    setFirstRowAsHeader(false);
    setIsUploadOpen(false);
  }

  function handleClear() {
    setCsvData(null);
    setFileName("");
    setParseErrors([]);
    setFirstRowAsHeader(false);
    try {
      localStorage.removeItem(LS_KEY_DATA);
      localStorage.removeItem(LS_KEY_FILE_NAME);
    } catch {
      // ignore
    }
    setIsUploadOpen(true);
  }

  function openUpload() {
    setIsUploadOpen(true);
  }

  function closeUpload() {
    setParseErrors([]);
    setIsUploadOpen(false);
  }

  return {
    csvData,
    fileName,
    isUploadOpen,
    parseErrors,
    delimiter,
    firstRowAsHeader,
    setFirstRowAsHeader,
    openUpload,
    closeUpload,
    handleFilePicked,
    handlePasteSubmit,
    handleStartBlank,
    handleClear,
  };
}
