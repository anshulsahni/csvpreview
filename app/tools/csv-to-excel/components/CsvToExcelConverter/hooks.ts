"use client";

import { useCallback, useState, type ChangeEvent, type DragEvent } from "react";
import { v4 as uuidv4 } from "uuid";
import { parseCSV, type ParseError } from "@/lib/csvParser";
import { csvSheetsToXlsxBlob } from "@/lib/xlsxExporter";
import { downloadBlob } from "@/lib/downloadFile";
import { track } from "@/lib/analytics";

export type OutputMode = "merge" | "separate";

/** A single uploaded CSV, parsed and ready to convert. */
export interface ConvertedFile {
  id: string;
  name: string;
  rows: string[][];
  rowCount: number;
  columnCount: number;
  errors: ParseError[];
}

export interface UseCsvToExcelConverterReturn {
  files: ConvertedFile[];
  mode: OutputMode;
  filename: string;
  isDragging: boolean;
  isConverting: boolean;
  rejectionMessage: string | null;
  canConvert: boolean;
  showModeChoice: boolean;
  showFilenameField: boolean;

  setMode: (mode: OutputMode) => void;
  setFilename: (value: string) => void;
  handleFilesPicked: (files: FileList | File[]) => void;
  handleFileInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleDragEnter: (event: DragEvent) => void;
  handleDragOver: (event: DragEvent) => void;
  handleDragLeave: (event: DragEvent) => void;
  handleDrop: (event: DragEvent) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  handleConvert: () => void;
}

const NON_CSV_MESSAGE = "Only .csv files are accepted";
const DEFAULT_XLSX_FILENAME = "csvpreview-export.xlsx";

/** True when the file looks like a CSV (by MIME type or `.csv` extension). */
export function isCsvFile(file: File): boolean {
  if (file.type === "text/csv") return true;
  return file.name.toLowerCase().endsWith(".csv");
}

/** Ensure a filename ends with a single `.xlsx`; empty falls back to a default. */
export function ensureXlsxExtension(name: string): string {
  const trimmed = name.trim();
  if (trimmed === "") return DEFAULT_XLSX_FILENAME;
  return trimmed.toLowerCase().endsWith(".xlsx") ? trimmed : `${trimmed}.xlsx`;
}

/**
 * Derive the pre-filled download name from a CSV filename by swapping the
 * `.csv` extension for `.xlsx` (e.g. `sales.csv` → `sales.xlsx`). Pure.
 */
export function swapCsvExtensionForXlsx(name: string): string {
  const trimmed = name.trim();
  if (trimmed === "") return DEFAULT_XLSX_FILENAME;
  const withoutCsv = trimmed.replace(/\.csv$/i, "");
  return ensureXlsxExtension(withoutCsv);
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) ?? "");
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file"));
    reader.readAsText(file);
  });
}

export function useCsvToExcelConverter(): UseCsvToExcelConverterReturn {
  const [files, setFiles] = useState<ConvertedFile[]>([]);
  const [mode, setMode] = useState<OutputMode>("merge");
  const [filename, setFilename] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null);

  const handleFilesPicked = useCallback(async (picked: FileList | File[]) => {
    const incoming = Array.from(picked);
    if (incoming.length === 0) return;

    const csvFiles = incoming.filter(isCsvFile);
    setRejectionMessage(csvFiles.length < incoming.length ? NON_CSV_MESSAGE : null);
    if (csvFiles.length === 0) return;

    const parsed: ConvertedFile[] = await Promise.all(
      csvFiles.map(async (file) => {
        const text = await readFileAsText(file);
        const { rows, errors } = parseCSV(text);
        return {
          id: uuidv4(),
          name: file.name,
          rows,
          rowCount: rows.length,
          columnCount: rows[0]?.length ?? 0,
          errors,
        };
      })
    );

    setFiles((prev) => [...prev, ...parsed]);
    // Pre-fill the download name from the first uploaded file, unless the user
    // has already typed one.
    setFilename((current) =>
      current.trim() === "" ? swapCsvExtensionForXlsx(parsed[0].name) : current
    );
  }, []);

  const handleFileInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.files) handleFilesPicked(event.target.files);
      // Clear so picking the same file again still re-triggers onChange.
      event.target.value = "";
    },
    [handleFilesPicked]
  );

  const handleDragEnter = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
      if (event.dataTransfer?.files) handleFilesPicked(event.dataTransfer.files);
    },
    [handleFilesPicked]
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setFilename("");
    setRejectionMessage(null);
  }, []);

  const handleConvert = useCallback(async () => {
    if (files.length === 0 || isConverting) return;
    // The merge/separate choice only applies with multiple files; a single file
    // is always a one-sheet workbook.
    const effectiveMode: OutputMode = files.length > 1 ? mode : "merge";
    setIsConverting(true);
    try {
      if (effectiveMode === "separate") {
        for (const file of files) {
          const blob = await csvSheetsToXlsxBlob([
            { name: file.name, rows: file.rows },
          ]);
          downloadBlob(blob, swapCsvExtensionForXlsx(file.name));
        }
      } else {
        const blob = await csvSheetsToXlsxBlob(
          files.map((file) => ({ name: file.name, rows: file.rows }))
        );
        downloadBlob(blob, ensureXlsxExtension(filename));
      }
      track("Excel Downloaded", {
        fileCount: files.length,
        mode: effectiveMode,
      });
    } finally {
      setIsConverting(false);
    }
  }, [files, mode, filename, isConverting]);

  const showModeChoice = files.length > 1;
  const showFilenameField =
    files.length > 0 && (files.length === 1 || mode === "merge");
  const canConvert =
    files.length > 0 &&
    !isConverting &&
    (!showFilenameField || filename.trim() !== "");

  return {
    files,
    mode,
    filename,
    isDragging,
    isConverting,
    rejectionMessage,
    canConvert,
    showModeChoice,
    showFilenameField,
    setMode,
    setFilename,
    handleFilesPicked,
    handleFileInputChange,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    removeFile,
    clearFiles,
    handleConvert,
  };
}
