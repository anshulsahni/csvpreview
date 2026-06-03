"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  parseCSV,
  type Delimiter,
  type ParseError,
} from "@/lib/csvParser";
import { exportCSV } from "@/lib/csvExporter";
import type { GridExportState } from "../SpreadsheetGrid";
import {
  computeDefaultFilename,
  ensureCsvExtension,
  type DownloadOptions,
} from "../DownloadModal/hooks";

export const LS_KEY_DATA = "csvpreview_data";
export const LS_KEY_FILE_NAME = "csvpreview_filename";
export const LS_KEY_FIRST_ROW_HEADER = "csvpreview_first_row_header";

const PASTED_FILENAME = "pasted.csv";

/**
 * Build the 2D array to export from the currently visible grid state: the
 * visible header, when present, plus all visible rows (post sort/filter).
 *
 * Pure and exported for unit testing.
 */
export function computeDownloadRows(
  visibleRows: string[][],
  headerRow: string[] | null
): string[][] {
  return headerRow === null ? visibleRows : [headerRow, ...visibleRows];
}

function triggerCsvDownload(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export interface UseCsvViewerReturn {
  csvData: string[][] | null;
  fileName: string;
  isUploadOpen: boolean;
  isDownloadOpen: boolean;
  defaultDownloadFilename: string;
  parseErrors: ParseError[];
  delimiter: Delimiter;
  firstRowAsHeader: boolean;
  hasActiveFilter: boolean;
  setFirstRowAsHeader: (value: boolean) => void;

  openUpload: () => void;
  closeUpload: () => void;
  openDownload: () => void;
  openDownloadAllRows: () => void;
  closeDownload: () => void;
  handleExportStateChange: (state: GridExportState) => void;
  handleDownload: (options: DownloadOptions) => void;
  handleFilePicked: (file: File) => void;
  handlePasteSubmit: (text: string) => void;
  handleStartBlank: () => void;
  handleClear: () => void;
  handleCellChange: (
    dataRowIndex: number,
    colIdx: number,
    value: string,
  ) => void;
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
  const [isDownloadOpen, setIsDownloadOpen] = useState<boolean>(false);
  const [downloadFilename, setDownloadFilename] = useState<string>(() =>
    computeDefaultFilename()
  );
  const [parseErrors, setParseErrors] = useState<ParseError[]>([]);
  const [delimiter] = useState<Delimiter>(",");
  const [firstRowAsHeader, setFirstRowAsHeader] = useState(false);
  const [exportState, setExportState] = useState<GridExportState>({
    headerRow: null,
    visibleRows: [],
    unfilteredRows: [],
    hasActiveFilter: false,
  });
  const [downloadIgnoreFilter, setDownloadIgnoreFilter] = useState<boolean>(false);
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
    setExportState({
      headerRow: null,
      visibleRows: [],
      unfilteredRows: [],
      hasActiveFilter: false,
    });
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

  function openDownload() {
    setDownloadFilename(computeDefaultFilename());
    setDownloadIgnoreFilter(false);
    setIsDownloadOpen(true);
  }

  function openDownloadAllRows() {
    setDownloadFilename(computeDefaultFilename());
    setDownloadIgnoreFilter(true);
    setIsDownloadOpen(true);
  }

  function closeDownload() {
    setIsDownloadOpen(false);
  }

  const handleExportStateChange = useCallback((state: GridExportState) => {
    setExportState(state);
  }, []);

  function handleDownload(options: DownloadOptions) {
    const sourceRows = downloadIgnoreFilter
      ? exportState.unfilteredRows
      : exportState.visibleRows;
    const rows = computeDownloadRows(sourceRows, exportState.headerRow);
    const csv = exportCSV(rows, delimiter);
    triggerCsvDownload(csv, ensureCsvExtension(options.filename));
    setIsDownloadOpen(false);
  }

  return {
    csvData,
    fileName,
    isUploadOpen,
    isDownloadOpen,
    defaultDownloadFilename: downloadFilename,
    parseErrors,
    delimiter,
    firstRowAsHeader,
    hasActiveFilter: exportState.hasActiveFilter,
    setFirstRowAsHeader,
    openUpload,
    closeUpload,
    openDownload,
    openDownloadAllRows,
    closeDownload,
    handleExportStateChange,
    handleDownload,
    handleFilePicked,
    handlePasteSubmit,
    handleStartBlank,
    handleClear,
    handleCellChange,
  };
}
