"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  parseCSV,
  type Delimiter,
  type ParseError,
} from "@/lib/csvParser";
import { exportCSV } from "@/lib/csvExporter";
import { rowsToCopyText, selectedCellsToCopyText } from "@/lib/clipboardUtils";
import type { GridExportState } from "../SpreadsheetGrid";
import { dataRowIndexFromBodyRowIndex } from "../SpreadsheetGrid/hooks";
import type { CellSelection } from "../SpreadsheetGrid/selectionUtils";
import { useToast } from "../Toast";
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
 * Resolve a set of source body indices (as emitted by the grid, in display
 * order) to the actual `csvData` rows they point at, accounting for the header
 * row offset. Out-of-range indices are skipped.
 *
 * Pure and exported for unit testing.
 */
export function selectedBodyIndicesToDataRows(
  csvData: string[][] | null,
  firstRowAsHeader: boolean,
  bodyIndices: number[]
): string[][] {
  if (!csvData) return [];
  const rows: string[][] = [];
  for (const bodyIndex of bodyIndices) {
    const dataRowIndex = dataRowIndexFromBodyRowIndex(
      firstRowAsHeader,
      bodyIndex
    );
    const row = csvData[dataRowIndex];
    if (row !== undefined) rows.push(row);
  }
  return rows;
}

/**
 * Return a new `csvData` with the given data-row indices removed. Removal is
 * order-independent and tolerant of duplicate or out-of-range indices.
 *
 * Pure and exported for unit testing.
 */
export function removeDataRows(
  csvData: string[][],
  dataRowIndices: number[]
): string[][] {
  const toRemove = new Set(dataRowIndices);
  return csvData.filter((_, index) => !toRemove.has(index));
}

/**
 * Derive the row/column counts shown in the header pills from the current grid
 * export state. Row counts come straight from the body rows (visible = after
 * filter, total = before filter). Column count is the true maximum width across
 * the header and unfiltered rows — not the display-padded grid width.
 *
 * Pure and exported for unit testing.
 */
export function computeGridCounts(state: GridExportState): {
  visibleRowCount: number;
  totalRowCount: number;
  columnCount: number;
} {
  const columnCount = state.unfilteredRows.reduce(
    (max, row) => Math.max(max, row.length),
    state.headerRow?.length ?? 0
  );
  return {
    visibleRowCount: state.visibleRows.length,
    totalRowCount: state.unfilteredRows.length,
    columnCount,
  };
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
  hasSelection: boolean;
  selectedRowCount: number;
  isConfirmDeleteOpen: boolean;
  counts: {
    visibleRowCount: number;
    totalRowCount: number;
    columnCount: number;
  };
  setFirstRowAsHeader: (value: boolean) => void;

  openUpload: () => void;
  closeUpload: () => void;
  openDownload: () => void;
  openDownloadAllRows: () => void;
  openDownloadSelected: () => void;
  closeDownload: () => void;
  handleExportStateChange: (state: GridExportState) => void;
  handleSelectionChange: (selection: CellSelection | null) => void;
  handleRowSelectionChange: (selectedBodyIndices: number[]) => void;
  handleDownload: (options: DownloadOptions) => void;
  handleCopyAll: () => Promise<void>;
  handleCopyFiltered: () => Promise<void>;
  handleCopySelected: () => Promise<void>;
  handleCopySelectedRows: () => Promise<void>;
  requestDeleteSelected: () => void;
  confirmDeleteSelected: () => void;
  cancelDeleteSelected: () => void;
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
  const [downloadSource, setDownloadSource] = useState<
    "visible" | "all" | "selected"
  >("visible");
  const [currentSelection, setCurrentSelection] = useState<CellSelection | null>(null);
  const [selectedRowBodyIndices, setSelectedRowBodyIndices] = useState<number[]>(
    []
  );
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState<boolean>(false);
  const { success } = useToast();
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
    // Malformed input: keep the upload modal open and list the errors there so
    // the user sees exactly which lines are bad. Nothing is loaded until the
    // input parses cleanly — the modal is the single place errors are shown.
    if (errors.length > 0) {
      setParseErrors(errors);
      return;
    }
    if (rows.length === 0) {
      setParseErrors([{ line: 0, message: "No data found" }]);
      return;
    }
    // Clean parse: load the rows and close the modal. Drop any prior row
    // selection — its body indices refer to the old data and would otherwise
    // point at unrelated rows in the new file (the grid only auto-clears on a
    // row-count change, so a same-length replacement would keep stale indices).
    setParseErrors([]);
    setCsvData(rows);
    setSelectedRowBodyIndices([]);
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
    setSelectedRowBodyIndices([]);
    setFileName("");
    setParseErrors([]);
    setFirstRowAsHeader(false);
    setIsUploadOpen(false);
  }

  function handleClear() {
    setCsvData(null);
    setSelectedRowBodyIndices([]);
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

  const handleRowSelectionChange = useCallback((indices: number[]) => {
    setSelectedRowBodyIndices(indices);
  }, []);

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

  async function handleCopySelectedRows() {
    if (selectedRowBodyIndices.length === 0) return;
    const selectedRows = selectedBodyIndicesToDataRows(
      csvData,
      firstRowAsHeader,
      selectedRowBodyIndices
    );
    const rows = computeDownloadRows(selectedRows, exportState.headerRow);
    await navigator.clipboard.writeText(rowsToCopyText(rows));
  }

  function openUpload() {
    // Starting a fresh upload clears any errors from a previous attempt so the
    // modal only shows errors relevant to the new input.
    setParseErrors([]);
    setIsUploadOpen(true);
  }

  function closeUpload() {
    setParseErrors([]);
    setIsUploadOpen(false);
  }

  function openDownload() {
    setDownloadFilename(computeDefaultFilename());
    setDownloadSource("visible");
    setIsDownloadOpen(true);
  }

  function openDownloadAllRows() {
    setDownloadFilename(computeDefaultFilename());
    setDownloadSource("all");
    setIsDownloadOpen(true);
  }

  function openDownloadSelected() {
    setDownloadFilename(computeDefaultFilename());
    setDownloadSource("selected");
    setIsDownloadOpen(true);
  }

  function closeDownload() {
    setIsDownloadOpen(false);
  }

  const handleExportStateChange = useCallback((state: GridExportState) => {
    setExportState(state);
  }, []);

  function handleDownload(options: DownloadOptions) {
    let sourceRows: string[][];
    if (downloadSource === "all") {
      sourceRows = exportState.unfilteredRows;
    } else if (downloadSource === "selected") {
      sourceRows = selectedBodyIndicesToDataRows(
        csvData,
        firstRowAsHeader,
        selectedRowBodyIndices
      );
    } else {
      sourceRows = exportState.visibleRows;
    }
    const rows = computeDownloadRows(sourceRows, exportState.headerRow);
    const csv = exportCSV(rows, delimiter);
    triggerCsvDownload(csv, ensureCsvExtension(options.filename));
    setIsDownloadOpen(false);
  }

  function requestDeleteSelected() {
    if (selectedRowBodyIndices.length === 0) return;
    setIsConfirmDeleteOpen(true);
  }

  function cancelDeleteSelected() {
    setIsConfirmDeleteOpen(false);
  }

  function confirmDeleteSelected() {
    const count = selectedRowBodyIndices.length;
    if (count === 0) {
      setIsConfirmDeleteOpen(false);
      return;
    }
    const dataRowIndices = selectedRowBodyIndices.map((bodyIndex) =>
      dataRowIndexFromBodyRowIndex(firstRowAsHeader, bodyIndex)
    );
    setCsvData((prev) => (prev === null ? prev : removeDataRows(prev, dataRowIndices)));
    setSelectedRowBodyIndices([]);
    setIsConfirmDeleteOpen(false);
    success(`${count} ${count === 1 ? "row" : "rows"} deleted`);
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
    hasSelection: currentSelection !== null,
    selectedRowCount: selectedRowBodyIndices.length,
    isConfirmDeleteOpen,
    counts: computeGridCounts(exportState),
    setFirstRowAsHeader,
    openUpload,
    closeUpload,
    openDownload,
    openDownloadAllRows,
    openDownloadSelected,
    closeDownload,
    handleExportStateChange,
    handleSelectionChange,
    handleRowSelectionChange,
    handleDownload,
    handleCopyAll,
    handleCopyFiltered,
    handleCopySelected,
    handleCopySelectedRows,
    requestDeleteSelected,
    confirmDeleteSelected,
    cancelDeleteSelected,
    handleFilePicked,
    handlePasteSubmit,
    handleStartBlank,
    handleClear,
    handleCellChange,
  };
}
