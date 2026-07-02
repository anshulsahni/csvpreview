"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  parseCSV,
  type Delimiter,
  type ParseError,
} from "@/lib/csvParser";
import { exportCSV } from "@/lib/csvExporter";
import { rowsToCopyText, selectedCellsToCopyText } from "@/lib/clipboardUtils";
import type { GridExportState } from "../SpreadsheetGrid";
import type { CellSelection } from "../SpreadsheetGrid/selectionUtils";
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

/**
 * Build a map from data-row index → combined error message for the rows that
 * have parse errors. Keys index into the parsed `rows` array (i.e. `csvData`),
 * which the grid uses to highlight the offending rows. Errors without a
 * `rowIndex` (e.g. empty-input messages) are ignored here.
 *
 * Pure and exported for unit testing.
 */
export function computeRowErrors(
  errors: ParseError[]
): Map<number, string> {
  const map = new Map<number, string>();
  for (const error of errors) {
    if (error.rowIndex === undefined) continue;
    const entry = `Line ${error.line}: ${error.message}`;
    const existing = map.get(error.rowIndex);
    map.set(error.rowIndex, existing ? `${existing}; ${entry}` : entry);
  }
  return map;
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
  rowErrors: Map<number, string>;
  showErrorBanner: boolean;
  dismissErrorBanner: () => void;
  delimiter: Delimiter;
  firstRowAsHeader: boolean;
  hasActiveFilter: boolean;
  hasSelection: boolean;
  setFirstRowAsHeader: (value: boolean) => void;

  openUpload: () => void;
  closeUpload: () => void;
  openDownload: () => void;
  openDownloadAllRows: () => void;
  closeDownload: () => void;
  handleExportStateChange: (state: GridExportState) => void;
  handleSelectionChange: (selection: CellSelection | null) => void;
  handleDownload: (options: DownloadOptions) => void;
  handleCopyAll: () => Promise<void>;
  handleCopyFiltered: () => Promise<void>;
  handleCopySelected: () => Promise<void>;
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
  const [errorBannerDismissed, setErrorBannerDismissed] = useState<boolean>(false);
  const [delimiter] = useState<Delimiter>(",");
  const [firstRowAsHeader, setFirstRowAsHeader] = useState(false);
  const [exportState, setExportState] = useState<GridExportState>({
    headerRow: null,
    visibleRows: [],
    unfilteredRows: [],
    hasActiveFilter: false,
  });
  const [downloadIgnoreFilter, setDownloadIgnoreFilter] = useState<boolean>(false);
  const [currentSelection, setCurrentSelection] = useState<CellSelection | null>(null);
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
    // Nothing parseable: keep the modal open and show the errors there so the
    // user can fix the input. There is no data to load in this case.
    if (rows.length === 0) {
      setParseErrors(
        errors.length > 0 ? errors : [{ line: 0, message: "No data found" }]
      );
      return;
    }
    // Load the valid rows and surface any errors as flags: the offending lines
    // are highlighted in the grid and listed in a dismissible banner.
    setParseErrors(errors);
    setErrorBannerDismissed(false);
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

  function handleSelectionChange(selection: CellSelection | null) {
    setCurrentSelection(selection);
  }

  async function handleCopyAll() {
    const rows = computeDownloadRows(exportState.unfilteredRows, exportState.headerRow);
    await navigator.clipboard.writeText(rowsToCopyText(rows));
  }

  async function handleCopyFiltered() {
    const rows = computeDownloadRows(exportState.visibleRows, exportState.headerRow);
    await navigator.clipboard.writeText(rowsToCopyText(rows));
  }

  async function handleCopySelected() {
    if (!currentSelection) return;
    const text = selectedCellsToCopyText(exportState.visibleRows, currentSelection);
    await navigator.clipboard.writeText(text);
  }

  function dismissErrorBanner() {
    setErrorBannerDismissed(true);
  }

  function openUpload() {
    // Starting a fresh upload clears flags from the currently loaded data so
    // the modal only shows errors relevant to the new input.
    setParseErrors([]);
    setErrorBannerDismissed(false);
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

  const rowErrors = useMemo(
    () => computeRowErrors(parseErrors),
    [parseErrors]
  );

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
    rowErrors,
    // The banner surfaces flags on already-loaded data; while the upload modal
    // is open it shows errors itself, so suppress the banner to avoid dupes.
    showErrorBanner:
      parseErrors.length > 0 && !errorBannerDismissed && !isUploadOpen,
    dismissErrorBanner,
    delimiter,
    firstRowAsHeader,
    hasActiveFilter: exportState.hasActiveFilter,
    hasSelection: currentSelection !== null,
    setFirstRowAsHeader,
    openUpload,
    closeUpload,
    openDownload,
    openDownloadAllRows,
    closeDownload,
    handleExportStateChange,
    handleSelectionChange,
    handleDownload,
    handleCopyAll,
    handleCopyFiltered,
    handleCopySelected,
    handleFilePicked,
    handlePasteSubmit,
    handleStartBlank,
    handleClear,
    handleCellChange,
  };
}
