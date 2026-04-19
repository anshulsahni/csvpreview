import { act, renderHook, waitFor } from "@testing-library/react";
import {
  LS_KEY_DATA,
  LS_KEY_NAME,
  useCsvViewer,
} from "@/app/components/CsvViewer/hooks";

beforeEach(() => {
  localStorage.clear();
});

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
  describe("mount behavior", () => {
    it("auto-opens the upload modal when localStorage is empty (objective #1)", async () => {
      const { result } = renderHook(() => useCsvViewer());

      await waitFor(() => {
        expect(result.current.isUploadOpen).toBe(true);
      });
      expect(result.current.csvData).toBeNull();
      expect(result.current.fileName).toBe("");
    });

    it("hydrates from localStorage and keeps modal closed when data exists (objective #5)", async () => {
      const rows = [
        ["Name", "Age"],
        ["Alice", "30"],
      ];
      localStorage.setItem(LS_KEY_DATA, JSON.stringify(rows));
      localStorage.setItem(LS_KEY_NAME, "people.csv");

      const { result } = renderHook(() => useCsvViewer());

      await waitFor(() => {
        expect(result.current.csvData).toEqual(rows);
      });
      expect(result.current.fileName).toBe("people.csv");
      expect(result.current.isUploadOpen).toBe(false);
    });

    it("treats malformed JSON in localStorage as no data and opens the modal", async () => {
      localStorage.setItem(LS_KEY_DATA, "not-json");

      const { result } = renderHook(() => useCsvViewer());

      await waitFor(() => {
        expect(result.current.isUploadOpen).toBe(true);
      });
      expect(result.current.csvData).toBeNull();
    });
  });

  describe("handleFilePicked (objective #2 — file path, objective #3 — errors)", () => {
    it("parses a valid .csv file, sets state, persists to localStorage, closes modal", async () => {
      mockFileReaderWithText("Name,Age\nAlice,30\nBob,25");
      const { result } = renderHook(() => useCsvViewer());

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
      expect(localStorage.getItem(LS_KEY_NAME)).toBe("people.csv");
      expect(JSON.parse(localStorage.getItem(LS_KEY_DATA) ?? "[]")).toEqual([
        ["Name", "Age"],
        ["Alice", "30"],
        ["Bob", "25"],
      ]);
    });

    it("surfaces parse errors with line numbers and keeps modal open on malformed CSV", async () => {
      mockFileReaderWithText('a,b\nc,d\n"unclosed');
      const { result } = renderHook(() => useCsvViewer());

      await waitFor(() => expect(result.current.isUploadOpen).toBe(true));

      act(() => {
        result.current.handleFilePicked(
          new File(["ignored"], "bad.csv", { type: "text/csv" })
        );
      });

      expect(result.current.parseErrors.length).toBeGreaterThan(0);
      expect(result.current.parseErrors[0].line).toBeGreaterThan(0);
      expect(typeof result.current.parseErrors[0].message).toBe("string");
      expect(result.current.isUploadOpen).toBe(true);
      expect(result.current.csvData).toBeNull();
      expect(localStorage.getItem(LS_KEY_DATA)).toBeNull();
    });

    it("does not overwrite already-loaded data when a new upload has parse errors", async () => {
      const rows = [["keep", "me"]];
      localStorage.setItem(LS_KEY_DATA, JSON.stringify(rows));
      localStorage.setItem(LS_KEY_NAME, "existing.csv");

      mockFileReaderWithText('"unclosed');
      const { result } = renderHook(() => useCsvViewer());

      await waitFor(() => expect(result.current.csvData).toEqual(rows));

      act(() => {
        result.current.openUpload();
      });

      act(() => {
        result.current.handleFilePicked(
          new File(["ignored"], "bad.csv", { type: "text/csv" })
        );
      });

      expect(result.current.parseErrors.length).toBeGreaterThan(0);
      expect(result.current.csvData).toEqual(rows);
      expect(result.current.fileName).toBe("existing.csv");
    });

    it("reports a synthetic error when FileReader fails", async () => {
      mockFileReaderWithError();
      const { result } = renderHook(() => useCsvViewer());

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

  describe("handlePasteSubmit (objective #2 — paste path)", () => {
    it("parses pasted CSV, sets filename to 'pasted.csv', closes modal", async () => {
      const { result } = renderHook(() => useCsvViewer());

      await waitFor(() => expect(result.current.isUploadOpen).toBe(true));

      act(() => {
        result.current.handlePasteSubmit("a,b\nc,d");
      });

      expect(result.current.csvData).toEqual([
        ["a", "b"],
        ["c", "d"],
      ]);
      expect(result.current.fileName).toBe("pasted.csv");
      expect(result.current.parseErrors).toEqual([]);
      expect(result.current.isUploadOpen).toBe(false);
    });

    it("reports empty-paste error when text is blank", async () => {
      const { result } = renderHook(() => useCsvViewer());
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

    it("surfaces parse errors for malformed pasted CSV (objective #3)", async () => {
      const { result } = renderHook(() => useCsvViewer());
      await waitFor(() => expect(result.current.isUploadOpen).toBe(true));

      act(() => {
        result.current.handlePasteSubmit('"unclosed');
      });

      expect(result.current.parseErrors.length).toBeGreaterThan(0);
      expect(result.current.parseErrors[0].line).toBe(1);
      expect(result.current.isUploadOpen).toBe(true);
    });
  });

  describe("handleStartBlank (objective #4)", () => {
    it("empties csvData, clears fileName and errors, closes modal", async () => {
      const { result } = renderHook(() => useCsvViewer());
      await waitFor(() => expect(result.current.isUploadOpen).toBe(true));

      act(() => {
        result.current.handlePasteSubmit('"bad');
      });
      expect(result.current.parseErrors.length).toBeGreaterThan(0);

      act(() => {
        result.current.handleStartBlank();
      });

      expect(result.current.csvData).toEqual([]);
      expect(result.current.fileName).toBe("");
      expect(result.current.parseErrors).toEqual([]);
      expect(result.current.isUploadOpen).toBe(false);
    });
  });

  describe("handleClear (objective #5 round-trip)", () => {
    it("resets state, removes localStorage keys, and reopens the modal", async () => {
      const rows = [["x"]];
      localStorage.setItem(LS_KEY_DATA, JSON.stringify(rows));
      localStorage.setItem(LS_KEY_NAME, "data.csv");

      const { result } = renderHook(() => useCsvViewer());
      await waitFor(() => expect(result.current.csvData).toEqual(rows));

      act(() => {
        result.current.handleClear();
      });

      expect(result.current.csvData).toBeNull();
      expect(result.current.fileName).toBe("");
      expect(result.current.parseErrors).toEqual([]);
      expect(result.current.isUploadOpen).toBe(true);
      expect(localStorage.getItem(LS_KEY_DATA)).toBeNull();
      expect(localStorage.getItem(LS_KEY_NAME)).toBeNull();
    });

    it("resets firstRowAsHeader to false", async () => {
      const rows = [["h"]];
      localStorage.setItem(LS_KEY_DATA, JSON.stringify(rows));

      const { result } = renderHook(() => useCsvViewer());
      await waitFor(() => expect(result.current.csvData).toEqual(rows));

      act(() => {
        result.current.setFirstRowAsHeader(true);
      });
      expect(result.current.firstRowAsHeader).toBe(true);

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

      const { result } = renderHook(() => useCsvViewer());
      await waitFor(() => expect(result.current.csvData).toEqual(rows));

      expect(result.current.firstRowAsHeader).toBe(false);
    });

    it("setFirstRowAsHeader updates the flag", async () => {
      const rows = [["a"]];
      localStorage.setItem(LS_KEY_DATA, JSON.stringify(rows));

      const { result } = renderHook(() => useCsvViewer());
      await waitFor(() => expect(result.current.csvData).toEqual(rows));

      act(() => {
        result.current.setFirstRowAsHeader(true);
      });
      expect(result.current.firstRowAsHeader).toBe(true);
    });
  });

  describe("open/close helpers", () => {
    it("openUpload and closeUpload toggle isUploadOpen", async () => {
      const rows = [["a"]];
      localStorage.setItem(LS_KEY_DATA, JSON.stringify(rows));

      const { result } = renderHook(() => useCsvViewer());
      await waitFor(() => expect(result.current.csvData).toEqual(rows));
      expect(result.current.isUploadOpen).toBe(false);

      act(() => result.current.openUpload());
      expect(result.current.isUploadOpen).toBe(true);

      act(() => result.current.closeUpload());
      expect(result.current.isUploadOpen).toBe(false);
    });

    it("closeUpload clears parseErrors", async () => {
      const { result } = renderHook(() => useCsvViewer());
      await waitFor(() => expect(result.current.isUploadOpen).toBe(true));

      act(() => {
        result.current.handlePasteSubmit('"bad');
      });
      expect(result.current.parseErrors.length).toBeGreaterThan(0);

      act(() => result.current.closeUpload());

      expect(result.current.parseErrors).toEqual([]);
      expect(result.current.isUploadOpen).toBe(false);
    });
  });
});
