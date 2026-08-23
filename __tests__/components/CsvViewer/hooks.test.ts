import { act, renderHook, waitFor } from "@testing-library/react";
import {
  LS_KEY_DATA,
  LS_KEY_FILE_NAME,
  LS_KEY_FIRST_ROW_HEADER,
  computeDownloadRows,
  computeGridCounts,
  removeDataRows,
  selectedBodyIndicesToDataRows,
  useCsvViewer,
} from "@/app/components/CsvViewer/hooks";
import { ToastProvider } from "@/app/components/Toast";
import { downloadBlob } from "@/lib/downloadFile";

jest.mock("@/lib/downloadFile", () => ({ downloadBlob: jest.fn() }));
jest.mock("@/lib/analytics", () => ({ track: jest.fn() }));

const downloadBlobMock = downloadBlob as jest.MockedFunction<typeof downloadBlob>;

beforeEach(() => {
  localStorage.clear();
  downloadBlobMock.mockClear();
});

/** Read back the text handed to the mocked `downloadBlob`. */
async function lastDownloadedText(): Promise<string> {
  const [blob] = downloadBlobMock.mock.calls.at(-1) ?? [];
  return blob === undefined ? "" : blob.text();
}

/**
 * Helper to install a FileReader mock that deterministically resolves with the
 * given text the next time readAsText() is called.
 */
function mockFileReaderWithText(text: string) {
  const readAsText = jest.fn();
  const reader: Partial<FileReader> & {
    onload: FileReader["onload"];
    onerror: FileReader["onerror"];
    result: string | null;
  } = {
    onload: null,
    onerror: null,
    result: null,
    readAsText,
  };
  readAsText.mockImplementation(function (this: unknown) {
    reader.result = text;
    (reader.onload as EventListener | null)?.({
      target: { result: text },
    } as unknown as ProgressEvent<FileReader>);
  });
  jest
    .spyOn(global, "FileReader")
    .mockImplementation(() => reader as FileReader);
  return reader;
}

/**
 * Like `mockFileReaderWithText`, but the read stays in flight until the caller
 * invokes the returned `finishRead`. Needed to observe the loading state that
 * only exists *while* a file is being read — a mock that resolves inside
 * readAsText() has already finished before the test can assert anything.
 */
function mockPendingFileReader(text: string) {
  const readAsText = jest.fn();
  const reader: Partial<FileReader> & {
    onload: FileReader["onload"];
    onerror: FileReader["onerror"];
    result: string | null;
    abort: () => void;
  } = {
    onload: null,
    onerror: null,
    result: null,
    readAsText,
    abort: jest.fn(),
  };
  jest
    .spyOn(global, "FileReader")
    .mockImplementation(() => reader as FileReader);

  return {
    reader,
    finishRead() {
      reader.result = text;
      (reader.onload as EventListener | null)?.({
        target: { result: text },
      } as unknown as ProgressEvent<FileReader>);
    },
  };
}

function mockFileReaderWithError() {
  const readAsText = jest.fn();
  const reader: Partial<FileReader> & {
    onload: FileReader["onload"];
    onerror: FileReader["onerror"];
  } = {
    onload: null,
    onerror: null,
    readAsText,
  };
  readAsText.mockImplementation(function (this: unknown) {
    (reader.onerror as EventListener | null)?.(
      {} as unknown as ProgressEvent<FileReader>
    );
  });
  jest
    .spyOn(global, "FileReader")
    .mockImplementation(() => reader as FileReader);
  return reader;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("useCsvViewer", () => {
  describe("computeDownloadRows", () => {
    it("returns visible rows plus header row when a header exists", () => {
      expect(
        computeDownloadRows(
          [
            ["Alice", "30"],
            ["Bob", "25"],
          ],
          ["Name", "Age"]
        )
      ).toEqual([
        ["Name", "Age"],
        ["Alice", "30"],
        ["Bob", "25"],
      ]);
    });

    it("returns visible rows as-is without a header row", () => {
      expect(computeDownloadRows([["a", "b"]], null)).toEqual([["a", "b"]]);
    });
  });

  describe("selectedBodyIndicesToDataRows", () => {
    const csv = [
      ["Name", "Age"],
      ["Alice", "30"],
      ["Bob", "25"],
      ["Carol", "40"],
    ];

    it("maps body indices to data rows, offset by the header when present", () => {
      // firstRowAsHeader => body index 0 is csv[1], 2 is csv[3].
      expect(selectedBodyIndicesToDataRows(csv, true, [0, 2])).toEqual([
        ["Alice", "30"],
        ["Carol", "40"],
      ]);
    });

    it("maps body indices directly when there is no header", () => {
      expect(selectedBodyIndicesToDataRows(csv, false, [0, 1])).toEqual([
        ["Name", "Age"],
        ["Alice", "30"],
      ]);
    });

    it("preserves the given index order (display order)", () => {
      expect(selectedBodyIndicesToDataRows(csv, true, [2, 0])).toEqual([
        ["Carol", "40"],
        ["Alice", "30"],
      ]);
    });

    it("skips out-of-range indices and tolerates null data", () => {
      expect(selectedBodyIndicesToDataRows(csv, true, [99])).toEqual([]);
      expect(selectedBodyIndicesToDataRows(null, false, [0])).toEqual([]);
    });
  });

  describe("removeDataRows", () => {
    const csv = [
      ["Name", "Age"],
      ["Alice", "30"],
      ["Bob", "25"],
      ["Carol", "40"],
    ];

    it("removes the given data-row indices, keeping the rest in order", () => {
      expect(removeDataRows(csv, [1, 3])).toEqual([
        ["Name", "Age"],
        ["Bob", "25"],
      ]);
    });

    it("is order-independent and tolerates duplicate indices", () => {
      expect(removeDataRows(csv, [3, 1, 1])).toEqual([
        ["Name", "Age"],
        ["Bob", "25"],
      ]);
    });

    it("ignores out-of-range indices", () => {
      expect(removeDataRows(csv, [99])).toEqual(csv);
    });
  });

  describe("computeGridCounts", () => {
    it("reports equal visible/total counts when no filter is active", () => {
      expect(
        computeGridCounts({
          headerRow: ["Name", "Age"],
          visibleRows: [
            ["Alice", "30"],
            ["Bob", "25"],
          ],
          unfilteredRows: [
            ["Alice", "30"],
            ["Bob", "25"],
          ],
          hasActiveFilter: false,
        })
      ).toEqual({ visibleRowCount: 2, totalRowCount: 2, columnCount: 2 });
    });

    it("reports fewer visible than total rows when filtered", () => {
      expect(
        computeGridCounts({
          headerRow: null,
          visibleRows: [["Alice", "30"]],
          unfilteredRows: [
            ["Alice", "30"],
            ["Bob", "25"],
            ["Cara", "40"],
          ],
          hasActiveFilter: true,
        })
      ).toEqual({ visibleRowCount: 1, totalRowCount: 3, columnCount: 2 });
    });

    it("takes the widest of header and unfiltered rows for the column count", () => {
      expect(
        computeGridCounts({
          headerRow: ["a", "b", "c", "d"],
          visibleRows: [["x", "y"]],
          unfilteredRows: [
            ["x", "y"],
            ["z"],
          ],
          hasActiveFilter: false,
        }).columnCount
      ).toBe(4);
    });

    it("returns zeros for an empty grid", () => {
      expect(
        computeGridCounts({
          headerRow: null,
          visibleRows: [],
          unfilteredRows: [],
          hasActiveFilter: false,
        })
      ).toEqual({ visibleRowCount: 0, totalRowCount: 0, columnCount: 0 });
    });
  });

  describe("mount behavior", () => {
    it("auto-opens the upload modal when localStorage is empty", async () => {
      const { result } = renderHook(() => useCsvViewer(), { wrapper: ToastProvider });

      await waitFor(() => {
        expect(result.current.isUploadOpen).toBe(true);
      });
      expect(result.current.csvData).toBeNull();
      expect(result.current.fileName).toBe("");
    });

    it("hydrates from localStorage and keeps modal closed when data exists", async () => {
      const rows = [
        ["Name", "Age"],
        ["Alice", "30"],
      ];
      localStorage.setItem(LS_KEY_DATA, JSON.stringify(rows));
      localStorage.setItem(LS_KEY_FILE_NAME, "people.csv");

      const { result } = renderHook(() => useCsvViewer(), { wrapper: ToastProvider });

      await waitFor(() => {
        expect(result.current.csvData).toEqual(rows);
      });
      expect(result.current.fileName).toBe("people.csv");
      expect(result.current.isUploadOpen).toBe(false);
    });

    it("treats malformed JSON in localStorage as no data and opens the modal", async () => {
      localStorage.setItem(LS_KEY_DATA, "not-json");

      const { result } = renderHook(() => useCsvViewer(), { wrapper: ToastProvider });

      await waitFor(() => {
        expect(result.current.isUploadOpen).toBe(true);
      });
      expect(result.current.csvData).toBeNull();
    });
  });

  describe("handleFilePicked()", () => {
    it("parses a valid .csv file, sets state, persists to localStorage, closes modal", async () => {
      mockFileReaderWithText("Name,Age\nAlice,30\nBob,25");
      const { result } = renderHook(() => useCsvViewer(), { wrapper: ToastProvider });

      await waitFor(() => expect(result.current.isUploadOpen).toBe(true));

      act(() => {
        result.current.handleFilePicked(
          new File(["ignored"], "people.csv", { type: "text/csv" })
        );
      });

      expect(result.current.csvData).toEqual([
        ["Name", "Age"],
        ["Alice", "30"],
        ["Bob", "25"],
      ]);
      expect(result.current.fileName).toBe("people.csv");
      expect(result.current.parseErrors).toEqual([]);
      expect(result.current.isUploadOpen).toBe(false);
      expect(localStorage.getItem(LS_KEY_FILE_NAME)).toBe("people.csv");
      expect(JSON.parse(localStorage.getItem(LS_KEY_DATA) ?? "[]")).toEqual([
        ["Name", "Age"],
        ["Alice", "30"],
        ["Bob", "25"],
      ]);
    });

    it("blocks the upload and keeps the modal open on malformed CSV", async () => {
      mockFileReaderWithText('a,b\nc,d\n"unclosed');
      const { result } = renderHook(() => useCsvViewer(), { wrapper: ToastProvider });

      await waitFor(() => expect(result.current.isUploadOpen).toBe(true));

      act(() => {
        result.current.handleFilePicked(
          new File(["ignored"], "bad.csv", { type: "text/csv" })
        );
      });

      expect(result.current.parseErrors.length).toBeGreaterThan(0);
      expect(result.current.parseErrors[0].line).toBeGreaterThan(0);
      expect(typeof result.current.parseErrors[0].message).toBe("string");
      // Nothing is loaded and the modal stays open so the errors show there.
      expect(result.current.isUploadOpen).toBe(true);
      expect(result.current.csvData).toBeNull();
      expect(localStorage.getItem(LS_KEY_DATA)).toBeNull();
    });

    it("keeps already-loaded data and reports 'No data found' when a new upload has no parseable rows", async () => {
      const rows = [["keep", "me"]];
      localStorage.setItem(LS_KEY_DATA, JSON.stringify(rows));
      localStorage.setItem(LS_KEY_FILE_NAME, "existing.csv");

      // A file with only blank/whitespace lines yields zero rows.
      mockFileReaderWithText("\n   \n");
      const { result } = renderHook(() => useCsvViewer(), { wrapper: ToastProvider });

      await waitFor(() => expect(result.current.csvData).toEqual(rows));

      act(() => {
        result.current.openUpload();
      });

      act(() => {
        result.current.handleFilePicked(
          new File(["ignored"], "empty.csv", { type: "text/csv" })
        );
      });

      expect(result.current.parseErrors).toEqual([
        { line: 0, message: "No data found" },
      ]);
      expect(result.current.isUploadOpen).toBe(true);
      expect(result.current.csvData).toEqual(rows);
      expect(result.current.fileName).toBe("existing.csv");
    });

    it("reports a synthetic error when FileReader fails", async () => {
      mockFileReaderWithError();
      const { result } = renderHook(() => useCsvViewer(), { wrapper: ToastProvider });

      await waitFor(() => expect(result.current.isUploadOpen).toBe(true));

      act(() => {
        result.current.handleFilePicked(
          new File(["ignored"], "unreadable.csv", { type: "text/csv" })
        );
      });

      expect(result.current.parseErrors).toEqual([
        { line: 0, message: "Could not read file" },
      ]);
      expect(result.current.csvData).toBeNull();
    });
  });

  describe("handlePasteSubmit()", () => {
    it("parses pasted CSV, sets filename to 'pasted.csv', closes modal", async () => {
      const { result } = renderHook(() => useCsvViewer(), { wrapper: ToastProvider });

      await waitFor(() => expect(result.current.isUploadOpen).toBe(true));

      act(() => {
        result.current.handlePasteSubmit("a,b\nc,d");
      });

      await waitFor(() =>
        expect(result.current.csvData).toEqual([
          ["a", "b"],
          ["c", "d"],
        ])
      );
      expect(result.current.fileName).toBe("pasted.csv");
      expect(result.current.parseErrors).toEqual([]);
      expect(result.current.isUploadOpen).toBe(false);
    });

    it("reports empty-paste error when text is blank", async () => {
      const { result } = renderHook(() => useCsvViewer(), { wrapper: ToastProvider });
      await waitFor(() => expect(result.current.isUploadOpen).toBe(true));

      act(() => {
        result.current.handlePasteSubmit("   \n\n  ");
      });

      expect(result.current.parseErrors).toEqual([
        { line: 0, message: "Paste area is empty" },
      ]);
      expect(result.current.csvData).toBeNull();
      expect(result.current.isUploadOpen).toBe(true);
    });

    it("blocks the upload and keeps the modal open for malformed pasted CSV", async () => {
      const { result } = renderHook(() => useCsvViewer(), { wrapper: ToastProvider });
      await waitFor(() => expect(result.current.isUploadOpen).toBe(true));

      act(() => {
        result.current.handlePasteSubmit('"unclosed');
      });

      await waitFor(() =>
        expect(result.current.parseErrors.length).toBeGreaterThan(0)
      );
      expect(result.current.parseErrors[0].line).toBe(1);
      expect(result.current.isUploadOpen).toBe(true);
      expect(result.current.csvData).toBeNull();
    });

    it("blocks the upload and reports the bad line for ragged rows", async () => {
      const { result } = renderHook(() => useCsvViewer(), { wrapper: ToastProvider });
      await waitFor(() => expect(result.current.isUploadOpen).toBe(true));

      act(() => {
        result.current.handlePasteSubmit("a,b\nc,d,e\nf,g");
      });

      // The ragged row is reported and nothing loads until it is fixed.
      await waitFor(() =>
        expect(result.current.parseErrors.length).toBeGreaterThan(0)
      );
      expect(result.current.csvData).toBeNull();
      expect(result.current.isUploadOpen).toBe(true);
      const raggedError = result.current.parseErrors.find((e) => e.line === 2);
      expect(raggedError).toBeDefined();
      expect(raggedError?.message).toContain("Expected 2");
    });

    it("loads cleanly-parsed CSV and closes the modal", async () => {
      const { result } = renderHook(() => useCsvViewer(), { wrapper: ToastProvider });
      await waitFor(() => expect(result.current.isUploadOpen).toBe(true));

      act(() => {
        result.current.handlePasteSubmit("a,b\nc,d\ne,f");
      });

      await waitFor(() =>
        expect(result.current.csvData).toEqual([
          ["a", "b"],
          ["c", "d"],
          ["e", "f"],
        ])
      );
      expect(result.current.parseErrors).toEqual([]);
      expect(result.current.isUploadOpen).toBe(false);
    });
  });

  describe("parsing status", () => {
    it("raises isParsing with the paste detail, then lowers it when the parse lands", async () => {
      const { result } = renderHook(() => useCsvViewer(), { wrapper: ToastProvider });
      await waitFor(() => expect(result.current.isUploadOpen).toBe(true));

      act(() => {
        result.current.handlePasteSubmit("a,b\nc,d");
      });

      // The parse is deferred until after paint, so the overlay is up here.
      expect(result.current.isParsing).toBe(true);
      expect(result.current.loadingDetail).toBe("pasted.csv");

      await waitFor(() => expect(result.current.isParsing).toBe(false));
      expect(result.current.csvData).toEqual([
        ["a", "b"],
        ["c", "d"],
      ]);
    });

    it("lowers isParsing even when the pasted CSV fails to parse", async () => {
      const { result } = renderHook(() => useCsvViewer(), { wrapper: ToastProvider });
      await waitFor(() => expect(result.current.isUploadOpen).toBe(true));

      act(() => {
        result.current.handlePasteSubmit('"unclosed');
      });
      expect(result.current.isParsing).toBe(true);

      await waitFor(() =>
        expect(result.current.parseErrors.length).toBeGreaterThan(0)
      );
      expect(result.current.isParsing).toBe(false);
    });

    it("reports the file name as the loading detail while a file is read", async () => {
      const { result } = renderHook(() => useCsvViewer(), { wrapper: ToastProvider });
      await waitFor(() => expect(result.current.isUploadOpen).toBe(true));

      const pending = mockPendingFileReader("a,b\nc,d");
      act(() => {
        result.current.handleFilePicked(
          new File(["a,b\nc,d"], "report.csv", { type: "text/csv" })
        );
      });

      // The read is still in flight here, so this is the state the overlay sees.
      expect(result.current.isParsing).toBe(true);
      expect(result.current.loadingDetail).toBe("report.csv");
      expect(result.current.csvData).toBeNull();

      act(() => {
        pending.finishRead();
      });

      expect(result.current.isParsing).toBe(false);
      expect(result.current.csvData).toEqual([
        ["a", "b"],
        ["c", "d"],
      ]);
      expect(result.current.fileName).toBe("report.csv");
    });

    it("drops a file read that handleClear cancelled mid-flight", async () => {
      const { result } = renderHook(() => useCsvViewer(), { wrapper: ToastProvider });
      await waitFor(() => expect(result.current.isUploadOpen).toBe(true));

      const pending = mockPendingFileReader("a,b\nc,d");
      act(() => {
        result.current.handleFilePicked(
          new File(["a,b\nc,d"], "report.csv", { type: "text/csv" })
        );
      });
      expect(result.current.isParsing).toBe(true);

      act(() => {
        result.current.handleClear();
      });
      expect(pending.reader.abort).toHaveBeenCalled();

      // The read completes anyway; its result must not land.
      act(() => {
        pending.finishRead();
      });

      expect(result.current.csvData).toBeNull();
      expect(result.current.isParsing).toBe(false);
    });

    it("drops a parse that is superseded by handleClear", async () => {
      const { result } = renderHook(() => useCsvViewer(), { wrapper: ToastProvider });
      await waitFor(() => expect(result.current.isUploadOpen).toBe(true));

      // Start a paste, then clear before the deferred parse gets to run.
      act(() => {
        result.current.handlePasteSubmit("a,b\nc,d");
      });
      act(() => {
        result.current.handleClear();
      });

      expect(result.current.isParsing).toBe(false);

      // Give the superseded callback every chance to fire; it must not land.
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      expect(result.current.csvData).toBeNull();
      expect(result.current.isParsing).toBe(false);
    });

    it("drops a parse that is superseded by handleStartBlank", async () => {
      const { result } = renderHook(() => useCsvViewer(), { wrapper: ToastProvider });
      await waitFor(() => expect(result.current.isUploadOpen).toBe(true));

      act(() => {
        result.current.handlePasteSubmit("a,b\nc,d");
      });
      act(() => {
        result.current.handleStartBlank();
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      expect(result.current.csvData).toEqual([]);
      expect(result.current.isParsing).toBe(false);
    });

    it("keeps only the newest parse when two pastes overlap", async () => {
      const { result } = renderHook(() => useCsvViewer(), { wrapper: ToastProvider });
      await waitFor(() => expect(result.current.isUploadOpen).toBe(true));

      act(() => {
        result.current.handlePasteSubmit("old,row\n1,2");
      });
      act(() => {
        result.current.handlePasteSubmit("new,row\n3,4");
      });

      await waitFor(() => expect(result.current.isParsing).toBe(false));
      expect(result.current.csvData).toEqual([
        ["new", "row"],
        ["3", "4"],
      ]);
    });
  });

  describe("handleStartBlank()", () => {
    it("empties csvData, clears fileName and errors, closes modal", async () => {
      const { result } = renderHook(() => useCsvViewer(), { wrapper: ToastProvider });
      await waitFor(() => expect(result.current.isUploadOpen).toBe(true));

      act(() => {
        result.current.handlePasteSubmit('"bad');
      });
      await waitFor(() =>
        expect(result.current.parseErrors.length).toBeGreaterThan(0)
      );

      act(() => {
        result.current.handleStartBlank();
      });

      expect(result.current.csvData).toEqual([]);
      expect(result.current.fileName).toBe("");
      expect(result.current.parseErrors).toEqual([]);
      expect(result.current.isUploadOpen).toBe(false);
    });
  });

  describe("handleClear()", () => {
    it("resets state, removes localStorage keys, and reopens the modal", async () => {
      const rows = [["x"]];
      localStorage.setItem(LS_KEY_DATA, JSON.stringify(rows));
      localStorage.setItem(LS_KEY_FILE_NAME, "data.csv");

      const { result } = renderHook(() => useCsvViewer(), { wrapper: ToastProvider });
      await waitFor(() => expect(result.current.csvData).toEqual(rows));

      act(() => {
        result.current.handleClear();
      });

      expect(result.current.csvData).toBeNull();
      expect(result.current.fileName).toBe("");
      expect(result.current.parseErrors).toEqual([]);
      expect(result.current.isUploadOpen).toBe(true);
      expect(localStorage.getItem(LS_KEY_DATA)).toBeNull();
      expect(localStorage.getItem(LS_KEY_FILE_NAME)).toBeNull();
    });

    it("resets firstRowAsHeader to false", async () => {
      const rows = [["h"]];
      localStorage.setItem(LS_KEY_DATA, JSON.stringify(rows));

      const { result } = renderHook(() => useCsvViewer(), { wrapper: ToastProvider });
      await waitFor(() => expect(result.current.csvData).toEqual(rows));

      act(() => {
        result.current.setFirstRowAsHeader(true);
      });

      act(() => {
        result.current.handleClear();
      });

      expect(result.current.firstRowAsHeader).toBe(false);
    });
  });

  describe("firstRowAsHeader", () => {
    it("defaults to false", async () => {
      const rows = [["a"]];
      localStorage.setItem(LS_KEY_DATA, JSON.stringify(rows));

      const { result } = renderHook(() => useCsvViewer(), { wrapper: ToastProvider });
      await waitFor(() => expect(result.current.csvData).toEqual(rows));

      expect(result.current.firstRowAsHeader).toBe(false);
    });

    it("restores persisted header toggle from localStorage", async () => {
      const rows = [["Name"], ["Alice"]];
      localStorage.setItem(LS_KEY_DATA, JSON.stringify(rows));
      localStorage.setItem(LS_KEY_FIRST_ROW_HEADER, "true");

      const { result } = renderHook(() => useCsvViewer(), { wrapper: ToastProvider });
      await waitFor(() =>
        expect(result.current.firstRowAsHeader).toBe(true)
      );
    });

    it("persists header toggle changes to localStorage", async () => {
      const rows = [["a"]];
      localStorage.setItem(LS_KEY_DATA, JSON.stringify(rows));

      const { result } = renderHook(() => useCsvViewer(), { wrapper: ToastProvider });
      await waitFor(() => expect(result.current.csvData).toEqual(rows));

      act(() => {
        result.current.setFirstRowAsHeader(true);
      });

      await waitFor(() =>
        expect(localStorage.getItem(LS_KEY_FIRST_ROW_HEADER)).toBe("true")
      );
    });
  });

  describe("open/close helpers", () => {
    it("openUpload and closeUpload toggle isUploadOpen", async () => {
      const rows = [["a"]];
      localStorage.setItem(LS_KEY_DATA, JSON.stringify(rows));

      const { result } = renderHook(() => useCsvViewer(), { wrapper: ToastProvider });
      await waitFor(() => expect(result.current.csvData).toEqual(rows));
      expect(result.current.isUploadOpen).toBe(false);

      act(() => result.current.openUpload());
      expect(result.current.isUploadOpen).toBe(true);

      act(() => result.current.closeUpload());
      expect(result.current.isUploadOpen).toBe(false);
    });

    it("closeUpload clears parseErrors", async () => {
      const { result } = renderHook(() => useCsvViewer(), { wrapper: ToastProvider });
      await waitFor(() => expect(result.current.isUploadOpen).toBe(true));

      act(() => {
        result.current.handlePasteSubmit('"bad');
      });
      await waitFor(() =>
        expect(result.current.parseErrors.length).toBeGreaterThan(0)
      );

      act(() => result.current.closeUpload());

      expect(result.current.parseErrors).toEqual([]);
      expect(result.current.isUploadOpen).toBe(false);
    });
  });

  describe("handleDownload()", () => {
    const HEADER_ROW = ["id", "name"];
    const VISIBLE_ROWS = [["1", "Ann"]];
    const UNFILTERED_ROWS = [
      ["1", "Ann"],
      ["2", "Bob"],
    ];

    /**
     * Mount the hook with a loaded sheet and a grid export state that has a
     * header row and an active filter — the shape every download branch reads.
     */
    async function mountWithExportState() {
      localStorage.setItem(LS_KEY_DATA, JSON.stringify(UNFILTERED_ROWS));
      const { result } = renderHook(() => useCsvViewer(), {
        wrapper: ToastProvider,
      });
      await waitFor(() => expect(result.current.csvData).toEqual(UNFILTERED_ROWS));

      act(() => {
        result.current.handleExportStateChange({
          headerRow: HEADER_ROW,
          visibleRows: VISIBLE_ROWS,
          unfilteredRows: UNFILTERED_ROWS,
          hasActiveFilter: true,
        });
      });

      return result;
    }

    it("exposes canDownloadJson only while the grid reports a header row", async () => {
      const result = await mountWithExportState();
      expect(result.current.canDownloadJson).toBe(true);

      act(() => {
        result.current.handleExportStateChange({
          headerRow: null,
          visibleRows: VISIBLE_ROWS,
          unfilteredRows: UNFILTERED_ROWS,
          hasActiveFilter: false,
        });
      });

      expect(result.current.canDownloadJson).toBe(false);
    });

    it("openDownloadJson selects the json format, openDownload the csv one", async () => {
      const result = await mountWithExportState();

      act(() => result.current.openDownloadJson());
      expect(result.current.downloadFormat).toBe("json");
      expect(result.current.isDownloadOpen).toBe(true);

      act(() => result.current.closeDownload());
      act(() => result.current.openDownload());
      expect(result.current.downloadFormat).toBe("csv");
    });

    it("writes CSV with the header row prepended", async () => {
      const result = await mountWithExportState();

      act(() => {
        result.current.handleDownload({ filename: "out.csv", format: "csv" });
      });

      expect(downloadBlobMock).toHaveBeenCalledTimes(1);
      expect(downloadBlobMock.mock.calls[0][1]).toBe("out.csv");
      expect(downloadBlobMock.mock.calls[0][0].type).toBe(
        "text/csv;charset=utf-8"
      );
      await expect(lastDownloadedText()).resolves.toBe("id,name\n1,Ann");
      expect(result.current.isDownloadOpen).toBe(false);
    });

    it("writes JSON keyed by the header row, without repeating it as a record", async () => {
      const result = await mountWithExportState();

      act(() => {
        result.current.handleDownload({ filename: "out.json", format: "json" });
      });

      expect(downloadBlobMock.mock.calls[0][1]).toBe("out.json");
      expect(downloadBlobMock.mock.calls[0][0].type).toBe(
        "application/json;charset=utf-8"
      );
      expect(JSON.parse(await lastDownloadedText())).toEqual([
        { id: "1", name: "Ann" },
      ]);
    });

    it("respects the scope chosen when the modal was opened", async () => {
      const result = await mountWithExportState();

      act(() => result.current.openDownloadAllRows());
      act(() => {
        result.current.handleDownload({ filename: "out.csv", format: "csv" });
      });

      await expect(lastDownloadedText()).resolves.toBe("id,name\n1,Ann\n2,Bob");
    });

    it("exports the visible rows for JSON, matching the primary button's scope", async () => {
      const result = await mountWithExportState();

      act(() => result.current.openDownloadJson());
      act(() => {
        result.current.handleDownload({ filename: "out.json", format: "json" });
      });

      expect(JSON.parse(await lastDownloadedText())).toEqual([
        { id: "1", name: "Ann" },
      ]);
    });
  });

  describe("handleCellChange()", () => {
    it("creates missing rows/cols and persists edits from blank state", async () => {
      const { result } = renderHook(() => useCsvViewer(), { wrapper: ToastProvider });
      await waitFor(() => expect(result.current.isUploadOpen).toBe(true));

      act(() => {
        result.current.handleCellChange(2, 3, "edited");
      });

      expect(result.current.csvData).toEqual([
        [],
        [],
        ["", "", "", "edited"],
      ]);
      expect(JSON.parse(localStorage.getItem(LS_KEY_DATA) ?? "[]")).toEqual([
        [],
        [],
        ["", "", "", "edited"],
      ]);
    });

    it("updates an existing cell without mutating unrelated cells", async () => {
      localStorage.setItem(
        LS_KEY_DATA,
        JSON.stringify([
          ["a", "b"],
          ["c", "d"],
        ])
      );
      const { result } = renderHook(() => useCsvViewer(), { wrapper: ToastProvider });
      await waitFor(() =>
        expect(result.current.csvData).toEqual([
          ["a", "b"],
          ["c", "d"],
        ])
      );

      act(() => {
        result.current.handleCellChange(1, 0, "changed");
      });

      expect(result.current.csvData).toEqual([
        ["a", "b"],
        ["changed", "d"],
      ]);
      expect(JSON.parse(localStorage.getItem(LS_KEY_DATA) ?? "[]")).toEqual([
        ["a", "b"],
        ["changed", "d"],
      ]);
    });

    // An edit rebuilds state that flows all the way back into the grid, so it
    // shares every row it did not touch and skips the write entirely when the
    // value is unchanged (CSV-36).
    it("copies only the edited row and shares the rest", async () => {
      localStorage.setItem(
        LS_KEY_DATA,
        JSON.stringify([
          ["a", "b"],
          ["c", "d"],
          ["e", "f"],
        ])
      );
      const { result } = renderHook(() => useCsvViewer(), { wrapper: ToastProvider });
      await waitFor(() => expect(result.current.csvData).not.toBeNull());
      const before = result.current.csvData!;

      act(() => {
        result.current.handleCellChange(1, 0, "changed");
      });

      const after = result.current.csvData!;
      expect(after).not.toBe(before);
      expect(after[1]).not.toBe(before[1]);
      expect(after[0]).toBe(before[0]);
      expect(after[2]).toBe(before[2]);
    });

    it("leaves csvData untouched when the cell already holds that value", async () => {
      localStorage.setItem(
        LS_KEY_DATA,
        JSON.stringify([
          ["a", "b"],
          ["c", "d"],
        ])
      );
      const { result } = renderHook(() => useCsvViewer(), { wrapper: ToastProvider });
      await waitFor(() => expect(result.current.csvData).not.toBeNull());
      const before = result.current.csvData!;

      act(() => {
        result.current.handleCellChange(1, 1, "d");
      });

      expect(result.current.csvData).toBe(before);
    });
  });
});
