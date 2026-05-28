"use client";

import { useEffect, useRef, useState } from "react";
import {
  parseCSV,
  type Delimiter,
  type ParseError,
} from "@/lib/csvParser";

export const LS_KEY_DATA = "csvpreview_data";
export const LS_KEY_FILE_NAME = "csvpreview_filename";
export const LS_KEY_FIRST_ROW_HEADER = "csvpreview_first_row_header";

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
  handleCellChange: (dataRowIndex: number, colIdx: number, value: string) => void;
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

function readPersistedFirstRowAsHeader(): boolean {
  try {
    return localStorage.getItem(LS_KEY_FIRST_ROW_HEADER) === "true";
  } catch {
    return false;
  }
}

export function useCsvViewer(): UseCsvViewerReturn {
  const [csvData, setCsvData] = useState<string[][] | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [parseErrors, setParseErrors] = useState<ParseError[]>([]);
  const [delimiter] = useState<Delimiter>(",");
  const [firstRowAsHeader, setFirstRowAsHeader] = useState(false);
  const isFirstRender = useRef<boolean>(true);

  useEffect(() => {
    const persisted = readPersistedRows();
    if (persisted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCsvData(persisted);
      setFileName(localStorage.getItem(LS_KEY_FILE_NAME) ?? "");
      setFirstRowAsHeader(readPersistedFirstRowAsHeader());
    } else {
      setIsUploadOpen(true);
    }
  }, []);

  useEffect(() => {
    try {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      localStorage.setItem(LS_KEY_FIRST_ROW_HEADER, String(firstRowAsHeader));
    } catch {
      // ignore
    }
  }, [firstRowAsHeader]);

  useEffect(() => {
    if (csvData === null) return;
    try {
      localStorage.setItem(LS_KEY_DATA, JSON.stringify(csvData));
    } catch {
      // ignore
    }
  }, [csvData]);

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
      localStorage.removeItem(LS_KEY_FIRST_ROW_HEADER);
    } catch {
      // ignore
    }
    setIsUploadOpen(true);
  }

  function handleCellChange(dataRowIndex: number, colIdx: number, value: string) {
    setCsvData((prev) => {
      const next = (prev ?? []).map((row) => row.slice());
      while (next.length <= dataRowIndex) {
        next.push([]);
      }
      const row = next[dataRowIndex]!;
      while (row.length <= colIdx) {
        row.push("");
      }
      row[colIdx] = value;
      return next;
    });
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
    handleCellChange,
  };
}
