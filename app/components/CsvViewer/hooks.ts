"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  parseCSV,
  type Delimiter,
  type ParseError,
} from "@/lib/csvParser";
import { exportCSV } from "@/lib/csvExporter";
import { exportJSON } from "@/lib/jsonExporter";
import { downloadBlob } from "@/lib/downloadFile";
import { DOWNLOAD_FORMATS, type DownloadFormat } from "@/lib/downloadFormats";
import { track } from "@/lib/analytics";
import { rowsToCopyText, selectedCellsToCopyText } from "@/lib/clipboardUtils";
import type { GridExportState } from "../SpreadsheetGrid";
import { dataRowIndexFromBodyRowIndex } from "../SpreadsheetGrid/hooks";
import type { CellSelection } from "../SpreadsheetGrid/selectionUtils";
import { useToast } from "../Toast";
import {
  computeDefaultFilenameStem,
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

/**
 * Run `callback` after the browser has had a chance to paint the current frame.
 * Parsing a large CSV blocks the main thread synchronously, so we yield first —
 * otherwise the loading overlay we just rendered would never appear before the
 * freeze. Falls back to a macrotask where `requestAnimationFrame` is missing.
 */
function runAfterPaint(callback: () => void): void {
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => {
      setTimeout(callback, 0);
    });
  } else {
    setTimeout(callback, 0);
  }
}

export interface UseCsvViewerReturn {
  csvData: string[][] | null;
  fileName: string;
  isUploadOpen: boolean;
  isDownloadOpen: boolean;
  defaultDownloadBaseName: string;
  downloadFormat: DownloadFormat;
  /** JSON needs a header row to key its objects by. */
  canDownloadJson: boolean;
  parseErrors: ParseError[];
  delimiter: Delimiter;
  firstRowAsHeader: boolean;
  hasActiveFilter: boolean;
  hasSelection: boolean;
  selectedRowCount: number;
  isConfirmDeleteOpen: boolean;
  /** True while a picked/pasted CSV is being read and parsed. */
  isParsing: boolean;
  /** Name of the file/source being parsed, shown in the loading overlay. */
  loadingDetail: string;
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
  openDownloadJson: () => void;
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
  const [downloadBaseName, setDownloadBaseName] = useState<string>(() =>
    computeDefaultFilenameStem()
  );
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>("csv");
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
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [loadingDetail, setLoadingDetail] = useState<string>("");
  const { success } = useToast();
  const isFirstRender = useRef<boolean>(true);
  // Bumped whenever a parse starts or the sheet is reset. A parse only commits
  // its result if it still holds the current generation, so a slow read that
  // lands after a newer upload/paste/clear can't resurrect stale rows or pull
  // the loading overlay out from under the parse that replaced it.
  const parseGeneration = useRef<number>(0);
  const activeReader = useRef<FileReader | null>(null);

  /** Start a new parse, invalidating any in-flight one. Returns its token. */
  function beginParse(): number {
    // `abort` is optional-called so a stubbed reader in tests can't break the
    // handoff; the generation check is what actually enforces correctness.
    activeReader.current?.abort?.();
    activeReader.current = null;
    parseGeneration.current += 1;
    return parseGeneration.current;
  }

  /** Discard whatever parse is in flight — used by the reset handlers. */
  function cancelParse(): void {
    beginParse();
    setIsParsing(false);
  }

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
    // Reading the file is asynchronous, so the overlay paints during the read;
    // the parse then runs (and blocks) in `onload` while the overlay is up.
    const generation = beginParse();
    setLoadingDetail(file.name);
    setIsParsing(true);
    const reader = new FileReader();
    activeReader.current = reader;
    reader.onload = function handleFileReaderLoad(event: ProgressEvent<FileReader>) {
      if (generation !== parseGeneration.current) return;
      activeReader.current = null;
      const text = (event.target?.result as string) ?? "";
      ingest(text, file.name);
      setIsParsing(false);
    };
    reader.onerror = function handleFileReaderError() {
      if (generation !== parseGeneration.current) return;
      activeReader.current = null;
      setParseErrors([{ line: 0, message: "Could not read file" }]);
      setIsParsing(false);
    };
    reader.readAsText(file);
  }

  function handlePasteSubmit(text: string) {
    if (text.trim() === "") {
      setParseErrors([{ line: 0, message: "Paste area is empty" }]);
      return;
    }
    // Pasting is synchronous, so yield after showing the overlay before the
    // (blocking) parse runs — otherwise the spinner never gets a chance to paint.
    const generation = beginParse();
    setLoadingDetail(PASTED_FILENAME);
    setIsParsing(true);
    runAfterPaint(() => {
      if (generation !== parseGeneration.current) return;
      ingest(text, PASTED_FILENAME);
      setIsParsing(false);
    });
  }

  function handleStartBlank() {
    cancelParse();
    setCsvData([]);
    setSelectedRowBodyIndices([]);
    setFileName("");
    setParseErrors([]);
    setFirstRowAsHeader(false);
    setIsUploadOpen(false);
  }

  function handleClear() {
    cancelParse();
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
      const current = prev ?? [];
      const existingRow = current[dataRowIndex];
      // Writing the value a cell already holds is a no-op: returning `prev`
      // untouched lets React skip the re-render entirely, and keeps the
      // persist-to-localStorage effect from re-serializing the whole sheet.
      if (existingRow !== undefined && (existingRow[colIdx] ?? "") === value) {
        return prev;
      }
      // Only the outer array and the one edited row are copied — every other row
      // is shared with the previous state, so an edit costs O(rows) pointer
      // copies rather than one string copy per cell in the sheet.
      const next = current.slice();
      while (next.length <= dataRowIndex) {
        next.push([]);
      }
      const row = next[dataRowIndex]!.slice();
      while (row.length <= colIdx) {
        row.push("");
      }
      row[colIdx] = value;
      next[dataRowIndex] = row;
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

  /**
   * Scope (which rows) and format (how they are serialized) are independent, so
   * every opener resets both explicitly rather than inheriting the last choice.
   */
  function openDownloadWith(
    source: "visible" | "all" | "selected",
    format: DownloadFormat
  ) {
    setDownloadBaseName(computeDefaultFilenameStem());
    setDownloadSource(source);
    setDownloadFormat(format);
    setIsDownloadOpen(true);
  }

  function openDownload() {
    openDownloadWith("visible", "csv");
  }

  function openDownloadAllRows() {
    openDownloadWith("all", "csv");
  }

  function openDownloadSelected() {
    openDownloadWith("selected", "csv");
  }

  function openDownloadJson() {
    openDownloadWith("visible", "json");
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
    // JSON turns the header row into object keys, so — unlike CSV — it must not
    // also be prepended as a record.
    const text =
      options.format === "json"
        ? exportJSON(exportState.headerRow ?? [], sourceRows)
        : exportCSV(
            computeDownloadRows(sourceRows, exportState.headerRow),
            delimiter
          );
    const blob = new Blob([text], {
      type: DOWNLOAD_FORMATS[options.format].mimeType,
    });
    downloadBlob(blob, options.filename);
    // The modal's submit button reads "Download" whatever the format, so the
    // global click listener can't tell the two apart — track it explicitly.
    track("Sheet Downloaded", {
      format: options.format,
      scope: downloadSource,
      rowCount: sourceRows.length,
    });
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
    defaultDownloadBaseName: downloadBaseName,
    downloadFormat,
    canDownloadJson: exportState.headerRow !== null,
    parseErrors,
    delimiter,
    firstRowAsHeader,
    hasActiveFilter: exportState.hasActiveFilter,
    hasSelection: currentSelection !== null,
    selectedRowCount: selectedRowBodyIndices.length,
    isConfirmDeleteOpen,
    isParsing,
    loadingDetail,
    counts: computeGridCounts(exportState),
    setFirstRowAsHeader,
    openUpload,
    closeUpload,
    openDownload,
    openDownloadAllRows,
    openDownloadSelected,
    openDownloadJson,
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
