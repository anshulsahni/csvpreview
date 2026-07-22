import { act, renderHook } from "@testing-library/react";
import {
  ensureXlsxExtension,
  isCsvFile,
  swapCsvExtensionForXlsx,
  useCsvToExcelConverter,
} from "@/app/tools/csv-to-excel/components/CsvToExcelConverter/hooks";
import { csvSheetsToXlsxBlob } from "@/lib/xlsxExporter";
import { downloadBlob } from "@/lib/downloadFile";
import { track } from "@/lib/analytics";

jest.mock("@/lib/xlsxExporter", () => ({
  csvSheetsToXlsxBlob: jest.fn(async () => new Blob(["stub"])),
}));
jest.mock("@/lib/downloadFile", () => ({ downloadBlob: jest.fn() }));
jest.mock("@/lib/analytics", () => ({ track: jest.fn() }));

const mockCsvSheetsToXlsxBlob = csvSheetsToXlsxBlob as jest.Mock;
const mockDownloadBlob = downloadBlob as jest.Mock;
const mockTrack = track as jest.Mock;

function csvFile(name: string, content = "a,b\nc,d"): File {
  return new File([content], name, { type: "text/csv" });
}

async function pick(
  result: { current: ReturnType<typeof useCsvToExcelConverter> },
  files: File[]
): Promise<void> {
  await act(async () => {
    await (result.current.handleFilesPicked(files) as unknown as Promise<void>);
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("CsvToExcelConverter hooks", () => {
  describe("ensureXlsxExtension", () => {
    it("appends .xlsx when missing", () => {
      expect(ensureXlsxExtension("report")).toBe("report.xlsx");
    });

    it("keeps an existing .xlsx suffix case-insensitively", () => {
      expect(ensureXlsxExtension("report.XLSX")).toBe("report.XLSX");
    });

    it("falls back to a default for blank input", () => {
      expect(ensureXlsxExtension("   ")).toBe("csvpreview-export.xlsx");
    });
  });

  describe("swapCsvExtensionForXlsx", () => {
    it("swaps a .csv extension for .xlsx", () => {
      expect(swapCsvExtensionForXlsx("sales.csv")).toBe("sales.xlsx");
    });

    it("swaps case-insensitively", () => {
      expect(swapCsvExtensionForXlsx("Sales.CSV")).toBe("Sales.xlsx");
    });

    it("adds .xlsx when there is no .csv extension", () => {
      expect(swapCsvExtensionForXlsx("sales")).toBe("sales.xlsx");
    });
  });

  describe("isCsvFile", () => {
    it("accepts a .csv filename", () => {
      expect(isCsvFile(new File([""], "data.csv"))).toBe(true);
    });

    it("accepts a text/csv MIME type", () => {
      expect(isCsvFile(new File([""], "data", { type: "text/csv" }))).toBe(true);
    });

    it("rejects a non-CSV file", () => {
      expect(isCsvFile(new File([""], "notes.txt", { type: "text/plain" }))).toBe(
        false
      );
    });
  });

  describe("useCsvToExcelConverter", () => {
    it("starts empty and cannot convert", () => {
      const { result } = renderHook(() => useCsvToExcelConverter());
      expect(result.current.files).toHaveLength(0);
      expect(result.current.canConvert).toBe(false);
      expect(result.current.mode).toBe("merge");
    });

    it("parses a picked file and pre-fills the filename", async () => {
      const { result } = renderHook(() => useCsvToExcelConverter());
      await pick(result, [csvFile("sales.csv")]);

      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0]).toMatchObject({
        name: "sales.csv",
        rowCount: 2,
        columnCount: 2,
      });
      expect(result.current.filename).toBe("sales.xlsx");
      expect(result.current.canConvert).toBe(true);
      expect(result.current.showModeChoice).toBe(false);
    });

    it("rejects non-CSV files with a message", async () => {
      const { result } = renderHook(() => useCsvToExcelConverter());
      await pick(result, [new File(["x"], "notes.txt", { type: "text/plain" })]);

      expect(result.current.files).toHaveLength(0);
      expect(result.current.rejectionMessage).toBe("Only .csv files are accepted");
    });

    it("offers the merge/separate choice for multiple files", async () => {
      const { result } = renderHook(() => useCsvToExcelConverter());
      await pick(result, [csvFile("a.csv"), csvFile("b.csv")]);

      expect(result.current.files).toHaveLength(2);
      expect(result.current.showModeChoice).toBe(true);
    });

    it("merges into one workbook and downloads with the chosen filename", async () => {
      const { result } = renderHook(() => useCsvToExcelConverter());
      await pick(result, [csvFile("a.csv"), csvFile("b.csv")]);

      act(() => result.current.setFilename("combined.xlsx"));
      await act(async () => {
        await (result.current.handleConvert() as unknown as Promise<void>);
      });

      expect(mockCsvSheetsToXlsxBlob).toHaveBeenCalledTimes(1);
      expect(mockCsvSheetsToXlsxBlob).toHaveBeenCalledWith([
        { name: "a.csv", rows: [["a", "b"], ["c", "d"]] },
        { name: "b.csv", rows: [["a", "b"], ["c", "d"]] },
      ]);
      expect(mockDownloadBlob).toHaveBeenCalledWith(expect.any(Blob), "combined.xlsx");
      expect(mockTrack).toHaveBeenCalledWith("Excel Downloaded", {
        fileCount: 2,
        mode: "merge",
      });
    });

    it("downloads one workbook per file in separate mode", async () => {
      const { result } = renderHook(() => useCsvToExcelConverter());
      await pick(result, [csvFile("first.csv"), csvFile("second.csv")]);

      act(() => result.current.setMode("separate"));
      await act(async () => {
        await (result.current.handleConvert() as unknown as Promise<void>);
      });

      expect(mockCsvSheetsToXlsxBlob).toHaveBeenCalledTimes(2);
      expect(mockDownloadBlob).toHaveBeenNthCalledWith(1, expect.any(Blob), "first.xlsx");
      expect(mockDownloadBlob).toHaveBeenNthCalledWith(2, expect.any(Blob), "second.xlsx");
      expect(mockTrack).toHaveBeenCalledWith("Excel Downloaded", {
        fileCount: 2,
        mode: "separate",
      });
    });

    it("surfaces a read error and keeps the batch out when reading fails", async () => {
      const OriginalFileReader = global.FileReader;
      class FailingFileReader {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        error = new Error("boom");
        readAsText() {
          this.onerror?.();
        }
      }
      global.FileReader = FailingFileReader as unknown as typeof FileReader;

      try {
        const { result } = renderHook(() => useCsvToExcelConverter());
        await pick(result, [csvFile("a.csv")]);

        expect(result.current.files).toHaveLength(0);
        expect(result.current.rejectionMessage).toBe(
          "Could not read one or more files. Please try again."
        );
      } finally {
        global.FileReader = OriginalFileReader;
      }
    });

    it("surfaces a conversion error and clears the converting state", async () => {
      mockCsvSheetsToXlsxBlob.mockRejectedValueOnce(new Error("fail"));
      const { result } = renderHook(() => useCsvToExcelConverter());
      await pick(result, [csvFile("a.csv")]);

      await act(async () => {
        await (result.current.handleConvert() as unknown as Promise<void>);
      });

      expect(result.current.rejectionMessage).toBe(
        "Conversion failed. Please try again."
      );
      expect(result.current.isConverting).toBe(false);
      expect(mockDownloadBlob).not.toHaveBeenCalled();
    });

    it("removes and clears files", async () => {
      const { result } = renderHook(() => useCsvToExcelConverter());
      await pick(result, [csvFile("a.csv"), csvFile("b.csv")]);

      const firstId = result.current.files[0].id;
      act(() => result.current.removeFile(firstId));
      expect(result.current.files).toHaveLength(1);

      act(() => result.current.clearFiles());
      expect(result.current.files).toHaveLength(0);
      expect(result.current.filename).toBe("");
    });
  });
});
