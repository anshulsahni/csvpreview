import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { ToastProvider } from "@/app/components/Toast";
import { ensureCsvExtension } from "@/app/components/DownloadModal/hooks";
import {
  MAX_FILES,
  MAX_FILE_BYTES,
  MAX_TOTAL_BYTES,
  UPLOAD_LIMITS,
  LIMITS_HINT,
  computeAcceptance,
  computeDefaultCsvName,
  computeTotalSheetCount,
  findSheet,
  formatMegabytes,
  isLegacyXlsFile,
  isXlsxFile,
  useExcelToCsvConverter,
  type UploadedWorkbook,
} from "@/app/tools/excel-to-csv/components/ExcelToCsvConverter/hooks";
import { peekSheetNames, readSheetRows } from "@/lib/xlsxImporter";
import { downloadBlob } from "@/lib/downloadFile";
import { track } from "@/lib/analytics";

jest.mock("@/lib/xlsxImporter", () => ({
  peekSheetNames: jest.fn(async () => ["Sheet1"]),
  readSheetRows: jest.fn(async () => [
    ["a", "b"],
    ["1", "2"],
  ]),
  sheetRowsToCsv: jest.requireActual("@/lib/xlsxImporter").sheetRowsToCsv,
}));
jest.mock("@/lib/downloadFile", () => ({ downloadBlob: jest.fn() }));
jest.mock("@/lib/analytics", () => ({ track: jest.fn() }));

const mockPeekSheetNames = peekSheetNames as jest.Mock;
const mockReadSheetRows = readSheetRows as jest.Mock;
const mockDownloadBlob = downloadBlob as jest.Mock;
const mockTrack = track as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockPeekSheetNames.mockResolvedValue(["Sheet1"]);
  mockReadSheetRows.mockResolvedValue([
    ["a", "b"],
    ["1", "2"],
  ]);
});

describe("ExcelToCsvConverter hooks", () => {import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { ToastProvider } from "@/app/components/Toast";
import { ensureCsvExtension } from "@/app/components/DownloadModal/hooks";
import {
  MAX_FILES,
  MAX_FILE_BYTES,
  MAX_TOTAL_BYTES,
  UPLOAD_LIMITS,
  LIMITS_HINT,
  computeAcceptance,
  computeDefaultCsvName,
  computeTotalSheetCount,
  findSheet,
  formatMegabytes,
  isLegacyXlsFile,
  isXlsxFile,
  useExcelToCsvConverter,
  type UploadedWorkbook,
} from "@/app/tools/excel-to-csv/components/ExcelToCsvConverter/hooks";
import { peekSheetNames, readSheetRows } from "@/lib/xlsxImporter";
import { downloadBlob } from "@/lib/downloadFile";
import { track } from "@/lib/analytics";

jest.mock("@/lib/xlsxImporter", () => ({
  peekSheetNames: jest.fn(async () => ["Sheet1"]),
  readSheetRows: jest.fn(async () => [
    ["a", "b"],
    ["1", "2"],
  ]),
  sheetRowsToCsv: jest.requireActual("@/lib/xlsxImporter").sheetRowsToCsv,
}));
jest.mock("@/lib/downloadFile", () => ({ downloadBlob: jest.fn() }));
jest.mock("@/lib/analytics", () => ({ track: jest.fn() }));

const mockPeekSheetNames = peekSheetNames as jest.Mock;
const mockReadSheetRows = readSheetRows as jest.Mock;
const mockDownloadBlob = downloadBlob as jest.Mock;
const mockTrack = track as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockPeekSheetNames.mockResolvedValue(["Sheet1"]);
  mockReadSheetRows.mockResolvedValue([
    ["a", "b"],
    ["1", "2"],
  ]);
});

describe("ExcelToCsvConverter hooks", () => {
  describe("isXlsxFile", () => {
    it("accepts .xlsx regardless of case", () => {
      expect(isXlsxFile(xlsxFile("book.xlsx"))).toBe(true);
      expect(isXlsxFile(xlsxFile("BOOK.XLSX"))).toBe(true);
    });

    it("rejects everything else", () => {
      expect(isXlsxFile(xlsxFile("book.xls"))).toBe(false);
      expect(isXlsxFile(xlsxFile("data.csv"))).toBe(false);
      expect(isXlsxFile(xlsxFile("xlsx"))).toBe(false);
    });
  });

  describe("isLegacyXlsFile", () => {
    it("recognises the legacy format irrespective of case", () => {
      expect(isLegacyXlsFile(xlsxFile("book.xls"))).toBe(true);
      expect(isLegacyXlsFile(xlsxFile("BOOK.XLS"))).toBe(true);
    });

    it("does not mistake .xlsx for .xls", () => {
      expect(isLegacyXlsFile(xlsxFile("book.xlsx"))).toBe(false);
    });
  });

  describe("formatMegabytes", () => {
    it("renders whole megabytes", () => {
      expect(formatMegabytes(20 * 1024 * 1024)).toBe("20MB");
      expect(formatMegabytes(50 * 1024 * 1024)).toBe("50MB");
    });
  });

  describe("computeDefaultCsvName", () => {
    it("joins the workbook base name and the sheet name", () => {
      expect(computeDefaultCsvName("sales.xlsx", "Q1 Report")).toBe(
        "sales-Q1 Report.csv"
      );
    });

    it("strips the extension case-insensitively", () => {
      expect(computeDefaultCsvName("Sales.XLSX", "Data")).toBe(
        "Sales-Data.csv"
      );
    });

    it("scrubs characters that are illegal in a filename", () => {
      expect(computeDefaultCsvName("book.xlsx", 'a/b\\c:d*e?f"g<h>i|j')).toBe(
        "book-a b c d e f g h i j.csv"
      );
    });

    it("falls back gracefully when the sheet name is only illegal characters", () => {
      expect(computeDefaultCsvName("book.xlsx", "///")).toBe("book.csv");
    });
  });

  describe("computeAcceptance", () => {
    it("accepts files that are within every limit", () => {
      const files = [xlsxFile("a.xlsx"), xlsxFile("b.xlsx")];
      const result = computeAcceptance([], files, UPLOAD_LIMITS);
      expect(result.accepted).toEqual(files);
      expect(result.rejections).toEqual([]);
    });

    it("rejects a legacy .xls with re-save guidance", () => {
      const result = computeAcceptance(
        [],
        [xlsxFile("old.xls")],
        UPLOAD_LIMITS
      );
      expect(result.accepted).toEqual([]);
      expect(result.rejections[0]).toContain("old.xls");
      expect(result.rejections[0]).toContain("re-save it as .xlsx");
    });

    it("rejects non-Excel files", () => {
      const result = computeAcceptance(
        [],
        [xlsxFile("data.csv")],
        UPLOAD_LIMITS
      );
      expect(result.accepted).toEqual([]);
      expect(result.rejections[0]).toContain("is not an .xlsx file");
    });

    it("rejects a file over the per-file limit", () => {
      const result = computeAcceptance(
        [],
        [xlsxFile("big.xlsx", MAX_FILE_BYTES + 1)],
        UPLOAD_LIMITS
      );
      expect(result.accepted).toEqual([]);
      expect(result.rejections[0]).toContain("larger than 20MB");
    });

    it("rejects files past the file-count limit", () => {
      const existing = Array.from({ length: MAX_FILES }, () => ({
        sizeBytes: 1,
      }));
      const result = computeAcceptance(
        existing,
        [xlsxFile("extra.xlsx")],
        UPLOAD_LIMITS
      );
      expect(result.accepted).toEqual([]);
      expect(result.rejections[0]).toContain(`up to ${MAX_FILES} files`);
    });

    it("counts files already accepted in the same batch toward the limit", () => {
      const incoming = Array.from({ length: MAX_FILES + 2 }, (_, index) =>
        xlsxFile(`f${index}.xlsx`)
      );
      const result = computeAcceptance([], incoming, UPLOAD_LIMITS);
      expect(result.accepted).toHaveLength(MAX_FILES);
      expect(result.rejections).toHaveLength(2);
    });

    it("rejects files that would push past the total-size limit", () => {
      const existing = [{ sizeBytes: MAX_TOTAL_BYTES - 10 }];
      const result = computeAcceptance(
        existing,
        [xlsxFile("more.xlsx", 1000)],
        UPLOAD_LIMITS
      );
      expect(result.accepted).toEqual([]);
      expect(result.rejections[0]).toContain("total past 50MB");
    });

    it("reports a distinct reason per file in a mixed batch", () => {
      const ok = xlsxFile("good.xlsx");
      const result = computeAcceptance(
        [],
        [
          ok,
          xlsxFile("old.xls"),
          xlsxFile("data.csv"),
          xlsxFile("big.xlsx", MAX_FILE_BYTES + 1),
        ],
        UPLOAD_LIMITS
      );
      expect(result.accepted).toEqual([ok]);
      expect(result.rejections).toHaveLength(3);
      expect(result.rejections[0]).toContain("old.xls");
      expect(result.rejections[1]).toContain("data.csv");
      expect(result.rejections[2]).toContain("big.xlsx");
    });
  });

  describe("computeTotalSheetCount", () => {
    it("sums the sheets of every workbook", () => {
      expect(
        computeTotalSheetCount([
          workbook(),
          workbook({
            id: "wb-2",
            sheets: [
              { id: "s-2", sheetName: "A", csvName: "a.csv" },
              { id: "s-3", sheetName: "B", csvName: "b.csv" },
            ],
          }),
        ])
      ).toBe(3);
    });

    it("is zero for no workbooks", () => {
      expect(computeTotalSheetCount([])).toBe(0);
    });
  });

  describe("findSheet", () => {
    it("finds a sheet and its parent workbook", () => {
      const books = [workbook()];
      expect(findSheet(books, "s-1")?.workbook).toBe(books[0]);
      expect(findSheet(books, "s-1")?.sheet.sheetName).toBe("Sheet1");
    });

    it("returns null for an unknown id", () => {
      expect(findSheet([workbook()], "nope")).toBeNull();
    });
  });

  describe("ensureCsvExtension (shared with the download modal)", () => {
    it("appends .csv when it is missing", () => {
      expect(ensureCsvExtension("sales")).toBe("sales.csv");
    });

    it("leaves an existing .csv alone", () => {
      expect(ensureCsvExtension("sales.csv")).toBe("sales.csv");
    });
  });

  describe("useExcelToCsvConverter", () => {
    it("adds a workbook with one entry per worksheet", async () => {
      mockPeekSheetNames.mockResolvedValue(["Summary", "Q1"]);
      const { result } = renderConverter();

      await pick(result, [xlsxFile("sales.xlsx")]);

      expect(result.current.workbooks).toHaveLength(1);
      expect(result.current.totalSheetCount).toBe(2);
      expect(
        result.current.workbooks[0].sheets.map((sheet) => sheet.csvName)
      ).toEqual(["sales-Summary.csv", "sales-Q1.csv"]);
      expect(result.current.rejectionMessage).toBeNull();
    });

    it("only peeks at the workbook index on upload — no sheet is parsed", async () => {
      const { result } = renderConverter();
      await pick(result, [xlsxFile("sales.xlsx")]);
      expect(mockPeekSheetNames).toHaveBeenCalledTimes(1);
      expect(mockReadSheetRows).not.toHaveBeenCalled();
    });

    it("explains why a file was rejected", async () => {
      const { result } = renderConverter();
      await pick(result, [xlsxFile("old.xls")]);

      expect(result.current.workbooks).toHaveLength(0);
      expect(result.current.rejectionMessage).toContain("re-save it as .xlsx");
    });

    it("reports an unreadable workbook", async () => {
      mockPeekSheetNames.mockRejectedValue(new Error("bad zip"));
      const { result } = renderConverter();

      await pick(result, [xlsxFile("broken.xlsx")]);

      expect(result.current.workbooks).toHaveLength(0);
      expect(result.current.rejectionMessage).toContain("could not be read");
    });

    it("reports a workbook with no worksheets", async () => {
      mockPeekSheetNames.mockResolvedValue([]);
      const { result } = renderConverter();

      await pick(result, [xlsxFile("empty.xlsx")]);

      expect(result.current.rejectionMessage).toContain("no worksheets");
    });

    it("renames a single sheet's CSV name", async () => {
      mockPeekSheetNames.mockResolvedValue(["Summary", "Q1"]);
      const { result } = renderConverter();
      await pick(result, [xlsxFile("sales.xlsx")]);
      const [first, second] = result.current.workbooks[0].sheets;

      act(() => result.current.renameCsv(first.id, "custom.csv"));

      expect(result.current.workbooks[0].sheets[0].csvName).toBe("custom.csv");
      expect(result.current.workbooks[0].sheets[1].csvName).toBe(
        second.csvName
      );
    });

    it("removes one workbook and clears them all", async () => {
      const { result } = renderConverter();
      await pick(result, [xlsxFile("a.xlsx")]);
      await pick(result, [xlsxFile("b.xlsx")]);
      expect(result.current.workbooks).toHaveLength(2);

      act(() => result.current.removeWorkbook(result.current.workbooks[0].id));
      expect(result.current.workbooks).toHaveLength(1);

      act(() => result.current.clearAll());
      expect(result.current.workbooks).toHaveLength(0);
      expect(result.current.rejectionMessage).toBeNull();
    });

    it("downloads one sheet as CSV", async () => {
      const { result } = renderConverter();
      await pick(result, [xlsxFile("sales.xlsx")]);
      const sheetId = result.current.workbooks[0].sheets[0].id;

      await act(async () => {
        await (result.current.downloadOne(sheetId) as unknown as Promise<void>);
      });

      expect(mockReadSheetRows).toHaveBeenCalledWith(
        expect.anything(),
        "Sheet1"
      );
      expect(mockDownloadBlob).toHaveBeenCalledTimes(1);
      expect(mockDownloadBlob.mock.calls[0][1]).toBe("sales-Sheet1.csv");
      expect(mockTrack).toHaveBeenCalledWith("CSV Downloaded From Excel", {
        sheetCount: 1,
        mode: "single",
      });
      expect(result.current.busySheetId).toBeNull();
    });

    it("copies one sheet as CSV text", async () => {
      const writeText = jest.fn(async () => undefined);
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText },
        configurable: true,
      });
      const { result } = renderConverter();
      await pick(result, [xlsxFile("sales.xlsx")]);
      const sheetId = result.current.workbooks[0].sheets[0].id;

      await act(async () => {
        await (result.current.copyOne(sheetId) as unknown as Promise<void>);
      });

      expect(writeText).toHaveBeenCalledWith("a,b\n1,2");
      expect(mockTrack).toHaveBeenCalledWith("CSV Copied From Excel");
    });

    it("zips every sheet, reading them one at a time", async () => {
      mockPeekSheetNames.mockResolvedValue(["Summary", "Q1"]);
      const { result } = renderConverter();
      await pick(result, [xlsxFile("sales.xlsx")]);

      await act(async () => {
        await (result.current.downloadAll() as unknown as Promise<void>);
      });

      expect(mockReadSheetRows).toHaveBeenCalledTimes(2);
      expect(mockDownloadBlob).toHaveBeenCalledTimes(1);
      expect(mockDownloadBlob.mock.calls[0][1]).toBe("csvpreview-sheets.zip");
      expect(mockDownloadBlob.mock.calls[0][0].type).toBe("application/zip");
      expect(mockTrack).toHaveBeenCalledWith("CSV Downloaded From Excel", {
        sheetCount: 2,
        mode: "zip",
      });
    });

    it("does nothing on download-all with no workbooks", async () => {
      const { result } = renderConverter();
      await act(async () => {
        await (result.current.downloadAll() as unknown as Promise<void>);
      });
      expect(mockDownloadBlob).not.toHaveBeenCalled();
    });
  });
});

/** Build a File of a chosen apparent size without allocating that many bytes. */
function xlsxFile(name: string, sizeBytes = 1024): File {
  const file = new File(["stub"], name);
  Object.defineProperty(file, "size", { value: sizeBytes });
  return file;
}

function workbook(overrides?: Partial<UploadedWorkbook>): UploadedWorkbook {
  return {
    id: "wb-1",
    file: xlsxFile("sales.xlsx"),
    name: "sales.xlsx",
    sizeBytes: 1024,
    sheets: [{ id: "s-1", sheetName: "Sheet1", csvName: "sales-Sheet1.csv" }],
    ...overrides,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  return createElement(ToastProvider, null, children);
}

function renderConverter() {
  return renderHook(() => useExcelToCsvConverter(), { wrapper });
}

async function pick(
  result: { current: ReturnType<typeof useExcelToCsvConverter> },
  files: File[]
): Promise<void> {
  await act(async () => {
    await (result.current.handleFilesPicked(files) as unknown as Promise<void>);
  });
}

  describe("isXlsxFile", () => {
    it("accepts .xlsx regardless of case", () => {
      expect(isXlsxFile(xlsxFile("book.xlsx"))).toBe(true);
      expect(isXlsxFile(xlsxFile("BOOK.XLSX"))).toBe(true);
    });

    it("rejects everything else", () => {
      expect(isXlsxFile(xlsxFile("book.xls"))).toBe(false);
      expect(isXlsxFile(xlsxFile("data.csv"))).toBe(false);
      expect(isXlsxFile(xlsxFile("xlsx"))).toBe(false);
    });
  });

  describe("isLegacyXlsFile", () => {
    it("recognises the legacy format irrespective of case", () => {
      expect(isLegacyXlsFile(xlsxFile("book.xls"))).toBe(true);
      expect(isLegacyXlsFile(xlsxFile("BOOK.XLS"))).toBe(true);
    });

    it("does not mistake .xlsx for .xls", () => {
      expect(isLegacyXlsFile(xlsxFile("book.xlsx"))).toBe(false);
    });
  });

  describe("formatMegabytes", () => {
    it("renders whole megabytes", () => {
      expect(formatMegabytes(20 * 1024 * 1024)).toBe("20MB");
      expect(formatMegabytes(50 * 1024 * 1024)).toBe("50MB");
    });
  });

  describe("LIMITS_HINT", () => {
    it("is derived from the same constants the checks enforce", () => {
      expect(LIMITS_HINT).toContain(String(MAX_FILES));
      expect(LIMITS_HINT).toContain(formatMegabytes(MAX_FILE_BYTES));
      expect(LIMITS_HINT).toContain(formatMegabytes(MAX_TOTAL_BYTES));
    });
  });

  describe("computeDefaultCsvName", () => {
    it("joins the workbook base name and the sheet name", () => {
      expect(computeDefaultCsvName("sales.xlsx", "Q1 Report")).toBe(
        "sales-Q1 Report.csv"
      );
    });

    it("strips the extension case-insensitively", () => {
      expect(computeDefaultCsvName("Sales.XLSX", "Data")).toBe(
        "Sales-Data.csv"
      );
    });

    it("scrubs characters that are illegal in a filename", () => {
      expect(computeDefaultCsvName("book.xlsx", 'a/b\\c:d*e?f"g<h>i|j')).toBe(
        "book-a b c d e f g h i j.csv"
      );
    });

    it("falls back gracefully when the sheet name is only illegal characters", () => {
      expect(computeDefaultCsvName("book.xlsx", "///")).toBe("book.csv");
    });
  });

  describe("computeAcceptance", () => {
    it("accepts files that are within every limit", () => {
      const files = [xlsxFile("a.xlsx"), xlsxFile("b.xlsx")];
      const result = computeAcceptance([], files, UPLOAD_LIMITS);
      expect(result.accepted).toEqual(files);
      expect(result.rejections).toEqual([]);
    });

    it("rejects a legacy .xls with re-save guidance", () => {
      const result = computeAcceptance(
        [],
        [xlsxFile("old.xls")],
        UPLOAD_LIMITS
      );
      expect(result.accepted).toEqual([]);
      expect(result.rejections[0]).toContain("old.xls");
      expect(result.rejections[0]).toContain("re-save it as .xlsx");
    });

    it("rejects non-Excel files", () => {
      const result = computeAcceptance(
        [],
        [xlsxFile("data.csv")],
        UPLOAD_LIMITS
      );
      expect(result.accepted).toEqual([]);
      expect(result.rejections[0]).toContain("is not an .xlsx file");
    });

    it("rejects a file over the per-file limit", () => {
      const result = computeAcceptance(
        [],
        [xlsxFile("big.xlsx", MAX_FILE_BYTES + 1)],
        UPLOAD_LIMITS
      );
      expect(result.accepted).toEqual([]);
      expect(result.rejections[0]).toContain("larger than 20MB");
    });

    it("rejects files past the file-count limit", () => {
      const existing = Array.from({ length: MAX_FILES }, () => ({
        sizeBytes: 1,
      }));
      const result = computeAcceptance(
        existing,
        [xlsxFile("extra.xlsx")],
        UPLOAD_LIMITS
      );
      expect(result.accepted).toEqual([]);
      expect(result.rejections[0]).toContain(`up to ${MAX_FILES} files`);
    });

    it("counts files already accepted in the same batch toward the limit", () => {
      const incoming = Array.from({ length: MAX_FILES + 2 }, (_, index) =>
        xlsxFile(`f${index}.xlsx`)
      );
      const result = computeAcceptance([], incoming, UPLOAD_LIMITS);
      expect(result.accepted).toHaveLength(MAX_FILES);
      expect(result.rejections).toHaveLength(2);
    });

    it("rejects files that would push past the total-size limit", () => {
      const existing = [{ sizeBytes: MAX_TOTAL_BYTES - 10 }];
      const result = computeAcceptance(
        existing,
        [xlsxFile("more.xlsx", 1000)],
        UPLOAD_LIMITS
      );
      expect(result.accepted).toEqual([]);
      expect(result.rejections[0]).toContain("total past 50MB");
    });

    it("reports a distinct reason per file in a mixed batch", () => {
      const ok = xlsxFile("good.xlsx");
      const result = computeAcceptance(
        [],
        [
          ok,
          xlsxFile("old.xls"),
          xlsxFile("data.csv"),
          xlsxFile("big.xlsx", MAX_FILE_BYTES + 1),
        ],
        UPLOAD_LIMITS
      );
      expect(result.accepted).toEqual([ok]);
      expect(result.rejections).toHaveLength(3);
      expect(result.rejections[0]).toContain("old.xls");
      expect(result.rejections[1]).toContain("data.csv");
      expect(result.rejections[2]).toContain("big.xlsx");
    });
  });

  describe("computeTotalSheetCount", () => {
    it("sums the sheets of every workbook", () => {
      expect(
        computeTotalSheetCount([
          workbook(),
          workbook({
            id: "wb-2",
            sheets: [
              { id: "s-2", sheetName: "A", csvName: "a.csv" },
              { id: "s-3", sheetName: "B", csvName: "b.csv" },
            ],
          }),
        ])
      ).toBe(3);
    });

    it("is zero for no workbooks", () => {
      expect(computeTotalSheetCount([])).toBe(0);
    });
  });

  describe("findSheet", () => {
    it("finds a sheet and its parent workbook", () => {
      const books = [workbook()];
      expect(findSheet(books, "s-1")?.workbook).toBe(books[0]);
      expect(findSheet(books, "s-1")?.sheet.sheetName).toBe("Sheet1");
    });

    it("returns null for an unknown id", () => {
      expect(findSheet([workbook()], "nope")).toBeNull();
    });
  });

  describe("ensureCsvExtension (shared with the download modal)", () => {
    it("appends .csv when it is missing", () => {
      expect(ensureCsvExtension("sales")).toBe("sales.csv");
    });

    it("leaves an existing .csv alone", () => {
      expect(ensureCsvExtension("sales.csv")).toBe("sales.csv");
    });
  });

  describe("useExcelToCsvConverter", () => {
    it("adds a workbook with one entry per worksheet", async () => {
      mockPeekSheetNames.mockResolvedValue(["Summary", "Q1"]);
      const { result } = renderConverter();

      await pick(result, [xlsxFile("sales.xlsx")]);

      expect(result.current.workbooks).toHaveLength(1);
      expect(result.current.totalSheetCount).toBe(2);
      expect(
        result.current.workbooks[0].sheets.map((sheet) => sheet.csvName)
      ).toEqual(["sales-Summary.csv", "sales-Q1.csv"]);
      expect(result.current.rejectionMessage).toBeNull();
    });

    it("only peeks at the workbook index on upload — no sheet is parsed", async () => {
      const { result } = renderConverter();
      await pick(result, [xlsxFile("sales.xlsx")]);
      expect(mockPeekSheetNames).toHaveBeenCalledTimes(1);
      expect(mockReadSheetRows).not.toHaveBeenCalled();
    });

    it("explains why a file was rejected", async () => {
      const { result } = renderConverter();
      await pick(result, [xlsxFile("old.xls")]);

      expect(result.current.workbooks).toHaveLength(0);
      expect(result.current.rejectionMessage).toContain("re-save it as .xlsx");
    });

    it("reports an unreadable workbook", async () => {
      mockPeekSheetNames.mockRejectedValue(new Error("bad zip"));
      const { result } = renderConverter();

      await pick(result, [xlsxFile("broken.xlsx")]);

      expect(result.current.workbooks).toHaveLength(0);
      expect(result.current.rejectionMessage).toContain("could not be read");
    });

    it("reports a workbook with no worksheets", async () => {
      mockPeekSheetNames.mockResolvedValue([]);
      const { result } = renderConverter();

      await pick(result, [xlsxFile("empty.xlsx")]);

      expect(result.current.rejectionMessage).toContain("no worksheets");
    });

    it("renames a single sheet's CSV name", async () => {
      mockPeekSheetNames.mockResolvedValue(["Summary", "Q1"]);
      const { result } = renderConverter();
      await pick(result, [xlsxFile("sales.xlsx")]);
      const [first, second] = result.current.workbooks[0].sheets;

      act(() => result.current.renameCsv(first.id, "custom.csv"));

      expect(result.current.workbooks[0].sheets[0].csvName).toBe("custom.csv");
      expect(result.current.workbooks[0].sheets[1].csvName).toBe(
        second.csvName
      );
    });

    it("removes one workbook and clears them all", async () => {
      const { result } = renderConverter();
      await pick(result, [xlsxFile("a.xlsx")]);
      await pick(result, [xlsxFile("b.xlsx")]);
      expect(result.current.workbooks).toHaveLength(2);

      act(() => result.current.removeWorkbook(result.current.workbooks[0].id));
      expect(result.current.workbooks).toHaveLength(1);

      act(() => result.current.clearAll());
      expect(result.current.workbooks).toHaveLength(0);
      expect(result.current.rejectionMessage).toBeNull();
    });

    it("downloads one sheet as CSV", async () => {
      const { result } = renderConverter();
      await pick(result, [xlsxFile("sales.xlsx")]);
      const sheetId = result.current.workbooks[0].sheets[0].id;

      await act(async () => {
        await (result.current.downloadOne(sheetId) as unknown as Promise<void>);
      });

      expect(mockReadSheetRows).toHaveBeenCalledWith(
        expect.anything(),
        "Sheet1"
      );
      expect(mockDownloadBlob).toHaveBeenCalledTimes(1);
      expect(mockDownloadBlob.mock.calls[0][1]).toBe("sales-Sheet1.csv");
      expect(mockTrack).toHaveBeenCalledWith("CSV Downloaded From Excel", {
        sheetCount: 1,
        mode: "single",
      });
      expect(result.current.busySheetId).toBeNull();
    });

    it("copies one sheet as CSV text", async () => {
      const writeText = jest.fn(async () => undefined);
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText },
        configurable: true,
      });
      const { result } = renderConverter();
      await pick(result, [xlsxFile("sales.xlsx")]);
      const sheetId = result.current.workbooks[0].sheets[0].id;

      await act(async () => {
        await (result.current.copyOne(sheetId) as unknown as Promise<void>);
      });

      expect(writeText).toHaveBeenCalledWith("a,b\n1,2");
      expect(mockTrack).toHaveBeenCalledWith("CSV Copied From Excel");
    });

    it("zips every sheet, reading them one at a time", async () => {
      mockPeekSheetNames.mockResolvedValue(["Summary", "Q1"]);
      const { result } = renderConverter();
      await pick(result, [xlsxFile("sales.xlsx")]);

      await act(async () => {
        await (result.current.downloadAll() as unknown as Promise<void>);
      });

      expect(mockReadSheetRows).toHaveBeenCalledTimes(2);
      expect(mockDownloadBlob).toHaveBeenCalledTimes(1);
      expect(mockDownloadBlob.mock.calls[0][1]).toBe("csvpreview-sheets.zip");
      expect(mockDownloadBlob.mock.calls[0][0].type).toBe("application/zip");
      expect(mockTrack).toHaveBeenCalledWith("CSV Downloaded From Excel", {
        sheetCount: 2,
        mode: "zip",
      });
    });

    it("does nothing on download-all with no workbooks", async () => {
      const { result } = renderConverter();
      await act(async () => {
        await (result.current.downloadAll() as unknown as Promise<void>);
      });
      expect(mockDownloadBlob).not.toHaveBeenCalled();
    });
  });
});

/** Build a File of a chosen apparent size without allocating that many bytes. */
function xlsxFile(name: string, sizeBytes = 1024): File {
  const file = new File(["stub"], name);
  Object.defineProperty(file, "size", { value: sizeBytes });
  return file;
}

function workbook(overrides?: Partial<UploadedWorkbook>): UploadedWorkbook {
  return {
    id: "wb-1",
    file: xlsxFile("sales.xlsx"),
    name: "sales.xlsx",
    sizeBytes: 1024,
    sheets: [{ id: "s-1", sheetName: "Sheet1", csvName: "sales-Sheet1.csv" }],
    ...overrides,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  return createElement(ToastProvider, null, children);
}

function renderConverter() {
  return renderHook(() => useExcelToCsvConverter(), { wrapper });
}

async function pick(
  result: { current: ReturnType<typeof useExcelToCsvConverter> },
  files: File[]
): Promise<void> {
  await act(async () => {
    await (result.current.handleFilesPicked(files) as unknown as Promise<void>);
  });
}
