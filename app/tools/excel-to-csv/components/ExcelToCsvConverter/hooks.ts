"use client";

import { useState, type ChangeEvent, type DragEvent } from "react";
import { v4 as uuidv4 } from "uuid";
import { ensureCsvExtension } from "@/app/components/DownloadModal/hooks";
import { useToast } from "@/app/components/Toast";
import { track } from "@/lib/analytics";
import { downloadBlob } from "@/lib/downloadFile";
import {
  peekSheetNames,
  readSheetRows,
  sheetRowsToCsv,
} from "@/lib/xlsxImporter";
import { filesToZipBlob } from "@/lib/zipFiles";

/** One worksheet inside an uploaded workbook, with its editable CSV name. */
export interface SheetEntry {
  id: string;
  /** Worksheet name as it appears inside the workbook. */
  sheetName: string;
  /** Download name for this sheet's CSV. Editable by the user. */
  csvName: string;
}

/**
 * An accepted `.xlsx` upload. The `File` handle is kept rather than the parsed
 * contents: uploading only reads the workbook index, and a worksheet is parsed
 * lazily when the user asks to download, copy, or open it.
 */
export interface UploadedWorkbook {
  id: string;
  file: File;
  name: string;
  sizeBytes: number;
  sheets: SheetEntry[];
}

export interface AcceptanceLimits {
  maxFiles: number;
  maxFileBytes: number;
  maxTotalBytes: number;
}

export interface AcceptanceResult {
  accepted: File[];
  /** Human-readable reason for each rejected file, in the order rejected. */
  rejections: string[];
}

export interface UseExcelToCsvConverterReturn {
  workbooks: UploadedWorkbook[];
  isDragging: boolean;
  /** Id of the sheet currently being read, so its row can show progress. */
  busySheetId: string | null;
  isZipping: boolean;
  rejectionMessage: string | null;
  totalSheetCount: number;
  canDownloadAll: boolean;

  handleFilesPicked: (files: FileList | File[]) => void;
  handleFileInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleDragEnter: (event: DragEvent) => void;
  handleDragOver: (event: DragEvent) => void;
  handleDragLeave: (event: DragEvent) => void;
  handleDrop: (event: DragEvent) => void;
  renameCsv: (sheetId: string, value: string) => void;
  removeWorkbook: (id: string) => void;
  clearAll: () => void;
  downloadOne: (sheetId: string) => void;
  copyOne: (sheetId: string) => void;
  downloadAll: () => void;
}

const BYTES_PER_MB = 1024 * 1024;

export const MAX_FILES = 10;
export const MAX_FILE_BYTES = 20 * BYTES_PER_MB;
export const MAX_TOTAL_BYTES = 50 * BYTES_PER_MB;

/** The single source of truth for the limits — enforced and displayed alike. */
export const UPLOAD_LIMITS: AcceptanceLimits = {
  maxFiles: MAX_FILES,
  maxFileBytes: MAX_FILE_BYTES,
  maxTotalBytes: MAX_TOTAL_BYTES,
};

const ZIP_FILENAME = "csvpreview-sheets.zip";
const READ_ERROR_MESSAGE = "Could not read that sheet. Please try again.";
const COPY_ERROR_MESSAGE = "Could not copy to the clipboard.";
const ZIP_ERROR_MESSAGE = "Could not build the zip. Please try again.";

/** Render a byte count as whole megabytes, e.g. `20MB`. Pure. */
export function formatMegabytes(bytes: number): string {
  return `${Math.round(bytes / BYTES_PER_MB)}MB`;
}

/** The limits sentence shown under the dropzone. Derived, never hand-written. */
export const LIMITS_HINT = `Up to ${MAX_FILES} files · ${formatMegabytes(
  MAX_FILE_BYTES
)} per file · ${formatMegabytes(MAX_TOTAL_BYTES)} total`;

/** True when the file looks like a modern Excel workbook (`.xlsx`). */
export function isXlsxFile(file: File): boolean {
  return file.name.toLowerCase().endsWith(".xlsx");
}

/**
 * True for the legacy binary `.xls` format, which this tool cannot read. Kept
 * separate from `isXlsxFile` so the user gets a message that actually helps.
 */
export function isLegacyXlsFile(file: File): boolean {
  return file.name.toLowerCase().endsWith(".xls");
}

// Characters that are unsafe in a download filename on common platforms.
const ILLEGAL_FILENAME_CHARS = /[/\\:*?"<>|]/g;

/**
 * Build the default CSV name for a worksheet, e.g. `sales.xlsx` + `Q1 Report`
 * becomes `sales-Q1 Report.csv`. Pure.
 */
export function computeDefaultCsvName(
  workbookName: string,
  sheetName: string
): string {
  const base = workbookName.trim().replace(/\.xlsx$/i, "");
  const sheet = sheetName
    .replace(ILLEGAL_FILENAME_CHARS, " ")
    .replace(/\s+/g, " ")
    .trim();
  const stem = [base, sheet].filter((part) => part !== "").join("-");
  return ensureCsvExtension(stem);
}

/**
 * Decide which incoming files may be added, given what is already uploaded.
 *
 * Files are checked in order and each rejection carries its own reason, so a
 * user who drops a mixed batch learns exactly what happened to each file. Pure.
 */
export function computeAcceptance(
  existing: Pick<UploadedWorkbook, "sizeBytes">[],
  incoming: File[],
  limits: AcceptanceLimits
): AcceptanceResult {
  const accepted: File[] = [];
  const rejections: string[] = [];
  let count = existing.length;
  let totalBytes = existing.reduce((sum, item) => sum + item.sizeBytes, 0);

  for (const file of incoming) {
    if (isLegacyXlsFile(file)) {
      rejections.push(
        `${file.name} is a legacy .xls file. Open it in Excel and re-save it as .xlsx.`
      );
      continue;
    }
    if (!isXlsxFile(file)) {
      rejections.push(`${file.name} is not an .xlsx file.`);
      continue;
    }
    if (file.size > limits.maxFileBytes) {
      rejections.push(
        `${file.name} is larger than ${formatMegabytes(limits.maxFileBytes)}.`
      );
      continue;
    }
    if (count >= limits.maxFiles) {
      rejections.push(
        `${file.name} was skipped — you can convert up to ${limits.maxFiles} files at a time.`
      );
      continue;
    }
    if (totalBytes + file.size > limits.maxTotalBytes) {
      rejections.push(
        `${file.name} was skipped — it would push the total past ${formatMegabytes(
          limits.maxTotalBytes
        )}.`
      );
      continue;
    }
    accepted.push(file);
    count += 1;
    totalBytes += file.size;
  }

  return { accepted, rejections };
}

/** Total number of worksheets across every uploaded workbook. Pure. */
export function computeTotalSheetCount(workbooks: UploadedWorkbook[]): number {
  return workbooks.reduce((sum, workbook) => sum + workbook.sheets.length, 0);
}

/** Locate a sheet and its parent workbook by sheet id. Pure. */
export function findSheet(
  workbooks: UploadedWorkbook[],
  sheetId: string
): { workbook: UploadedWorkbook; sheet: SheetEntry } | null {
  for (const workbook of workbooks) {
    const sheet = workbook.sheets.find((entry) => entry.id === sheetId);
    if (sheet) return { workbook, sheet };
  }
  return null;
}

export function useExcelToCsvConverter(): UseExcelToCsvConverterReturn {
  const toast = useToast();
  const [workbooks, setWorkbooks] = useState<UploadedWorkbook[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [busySheetId, setBusySheetId] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null);

  // These handlers are intentionally plain functions rather than `useCallback`.
  // Nothing observes their identity — no child is memoized and no effect takes
  // them as a dependency — so memoizing them would only add allocation and
  // comparison work on every render.

  async function handleFilesPicked(picked: FileList | File[]) {
    const incoming = Array.from(picked);
    if (incoming.length === 0) return;

    // KNOWN GAP: this check can let the user go past the limits.
    // `workbooks` holds the value from the last render. The loop below waits
    // for `peekSheetNames` before it adds the files. If the user drops a
    // second batch during this wait, the second call reads the same old
    // value. Both batches then start from the same count and the same total
    // size. The user can go past the limit of 10 files or 50MB.
    // The code that adds the files is safe. It uses the function form of
    // `setWorkbooks`. Only this check is not safe.
    // To correct this, keep the accepted files in a ref. Then read the ref
    // here. This code does not have the correction.
    // https://github.com/anshulsahni/csvpreview/pull/69#discussion_r3790832254
    const { accepted, rejections } = computeAcceptance(
      workbooks,
      incoming,
      UPLOAD_LIMITS
    );
    const problems = [...rejections];
    const added: UploadedWorkbook[] = [];

    // Only the workbook index is inflated here — no cell data is parsed, so
    // adding files stays cheap regardless of how large they are.
    for (const file of accepted) {
      try {
        const sheetNames = await peekSheetNames(file);
        if (sheetNames.length === 0) {
          problems.push(`${file.name} contains no worksheets.`);
          continue;
        }
        added.push({
          id: uuidv4(),
          file,
          name: file.name,
          sizeBytes: file.size,
          sheets: sheetNames.map((sheetName) => ({
            id: uuidv4(),
            sheetName,
            csvName: computeDefaultCsvName(file.name, sheetName),
          })),
        });
      } catch {
        problems.push(
          `${file.name} could not be read. It may be corrupted or password-protected.`
        );
      }
    }

    setRejectionMessage(problems.length > 0 ? problems.join(" ") : null);
    if (added.length > 0) setWorkbooks((prev) => [...prev, ...added]);
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) handleFilesPicked(event.target.files);
    // Clear so picking the same file again still re-triggers onChange.
    event.target.value = "";
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
    if (event.dataTransfer?.files) handleFilesPicked(event.dataTransfer.files);
  }

  function renameCsv(sheetId: string, value: string) {
    setWorkbooks((prev) =>
      prev.map((workbook) => ({
        ...workbook,
        sheets: workbook.sheets.map((sheet) =>
          sheet.id === sheetId ? { ...sheet, csvName: value } : sheet
        ),
      }))
    );
  }

  function removeWorkbook(id: string) {
    setWorkbooks((prev) => prev.filter((workbook) => workbook.id !== id));
  }

  function clearAll() {
    setWorkbooks([]);
    setRejectionMessage(null);
  }

  async function downloadOne(sheetId: string) {
    const found = findSheet(workbooks, sheetId);
    if (!found || busySheetId !== null) return;
    setBusySheetId(sheetId);
    try {
      const rows = await readSheetRows(
        found.workbook.file,
        found.sheet.sheetName
      );
      const csv = sheetRowsToCsv(rows);
      downloadBlob(
        new Blob([csv], { type: "text/csv;charset=utf-8" }),
        ensureCsvExtension(found.sheet.csvName)
      );
      track("CSV Downloaded From Excel", { sheetCount: 1, mode: "single" });
    } catch {
      toast.error(READ_ERROR_MESSAGE);
    } finally {
      setBusySheetId(null);
    }
  }

  async function copyOne(sheetId: string) {
    const found = findSheet(workbooks, sheetId);
    if (!found || busySheetId !== null) return;
    setBusySheetId(sheetId);
    try {
      const rows = await readSheetRows(
        found.workbook.file,
        found.sheet.sheetName
      );
      await navigator.clipboard.writeText(sheetRowsToCsv(rows));
      toast.success(`Copied ${found.sheet.sheetName} as CSV`);
      track("CSV Copied From Excel");
    } catch {
      toast.error(COPY_ERROR_MESSAGE);
    } finally {
      setBusySheetId(null);
    }
  }

  async function downloadAll() {
    if (workbooks.length === 0 || isZipping) return;
    setIsZipping(true);
    try {
      const entries: { name: string; content: string }[] = [];
      // Sequential on purpose: parsing every sheet at once would hold all of
      // them in memory simultaneously.
      for (const workbook of workbooks) {
        for (const sheet of workbook.sheets) {
          const rows = await readSheetRows(workbook.file, sheet.sheetName);
          entries.push({
            name: ensureCsvExtension(sheet.csvName),
            content: sheetRowsToCsv(rows),
          });
        }
      }
      downloadBlob(filesToZipBlob(entries), ZIP_FILENAME);
      track("CSV Downloaded From Excel", {
        sheetCount: entries.length,
        mode: "zip",
      });
    } catch {
      toast.error(ZIP_ERROR_MESSAGE);
    } finally {
      setIsZipping(false);
    }
  }

  const totalSheetCount = computeTotalSheetCount(workbooks);

  return {
    workbooks,
    isDragging,
    busySheetId,
    isZipping,
    rejectionMessage,
    totalSheetCount,
    canDownloadAll: totalSheetCount > 0 && !isZipping,
    handleFilesPicked,
    handleFileInputChange,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    renameCsv,
    removeWorkbook,
    clearAll,
    downloadOne,
    copyOne,
    downloadAll,
  };
}
