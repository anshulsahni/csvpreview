import { act, renderHook } from "@testing-library/react";
import React from "react";
import {
  computeDefaultFilename,
  computeDefaultFilenameStem,
  ensureCsvExtension,
  useDownloadModal,
  type DownloadModalRenderProps,
} from "@/app/components/DownloadModal/hooks";
import { KeyboardShortcutsProvider } from "@/app/components/KeyboardShortcuts/KeyboardShortcutsProvider";

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(KeyboardShortcutsProvider, null, children);
}

function makeArgs(
  overrides?: Partial<DownloadModalRenderProps>
): DownloadModalRenderProps {
  return {
    isOpen: true,
    format: "csv",
    onClose: jest.fn(),
    defaultBaseName: "csvpreview-export-2026-05-31",
    onDownload: jest.fn(),
    ...overrides,
  };
}

function makeSubmitEvent(): React.FormEvent<HTMLFormElement> {
  return {
    preventDefault: jest.fn(),
  } as unknown as React.FormEvent<HTMLFormElement>;
}

describe("DownloadModal hooks", () => {
  describe("computeDefaultFilenameStem", () => {
    it("builds a date-stamped stem without an extension", () => {
      expect(computeDefaultFilenameStem(new Date(2026, 4, 31))).toBe(
        "csvpreview-export-2026-05-31"
      );
    });
  });

  describe("computeDefaultFilename", () => {
    it("builds a date-stamped filename", () => {
      expect(computeDefaultFilename(new Date(2026, 4, 31))).toBe(
        "csvpreview-export-2026-05-31.csv"
      );
    });
  });

  describe("ensureCsvExtension", () => {
    it("appends .csv when missing", () => {
      expect(ensureCsvExtension("people")).toBe("people.csv");
    });

    it("keeps an existing .csv suffix case-insensitively", () => {
      expect(ensureCsvExtension("people.CSV")).toBe("people.CSV");
    });
  });

  describe("useDownloadModal", () => {
    it("defaults to the provided base name", () => {
      const { result } = renderHook(() => useDownloadModal(makeArgs()), {
        wrapper,
      });

      expect(result.current.baseName).toBe("csvpreview-export-2026-05-31");
    });

    it("exposes the title and locked extension for the chosen format", () => {
      const { result } = renderHook(
        () => useDownloadModal(makeArgs({ format: "json" })),
        { wrapper }
      );

      expect(result.current.title).toBe("Download JSON");
      expect(result.current.extension).toBe(".json");
    });

    it("submits the edited name with the csv extension appended", () => {
      const onDownload = jest.fn();
      const { result } = renderHook(
        () => useDownloadModal(makeArgs({ onDownload })),
        { wrapper }
      );

      act(() => {
        result.current.setBaseName("my-export");
      });

      act(() => {
        result.current.handleSubmit(makeSubmitEvent());
      });

      expect(onDownload).toHaveBeenCalledWith({
        filename: "my-export.csv",
        format: "csv",
      });
    });

    it("submits the json extension when the format is json", () => {
      const onDownload = jest.fn();
      const { result } = renderHook(
        () => useDownloadModal(makeArgs({ format: "json", onDownload })),
        { wrapper }
      );

      act(() => {
        result.current.setBaseName("my-export");
      });

      act(() => {
        result.current.handleSubmit(makeSubmitEvent());
      });

      expect(onDownload).toHaveBeenCalledWith({
        filename: "my-export.json",
        format: "json",
      });
    });

    it("does not double up an extension the user typed themselves", () => {
      const onDownload = jest.fn();
      const { result } = renderHook(
        () => useDownloadModal(makeArgs({ format: "json", onDownload })),
        { wrapper }
      );

      act(() => {
        result.current.setBaseName("my-export.json");
      });

      act(() => {
        result.current.handleSubmit(makeSubmitEvent());
      });

      expect(onDownload).toHaveBeenCalledWith({
        filename: "my-export.json",
        format: "json",
      });
    });

    it("falls back to the default stem when the field is blank", () => {
      const onDownload = jest.fn();
      const { result } = renderHook(
        () => useDownloadModal(makeArgs({ onDownload })),
        { wrapper }
      );

      act(() => {
        result.current.setBaseName("   ");
      });

      act(() => {
        result.current.handleSubmit(makeSubmitEvent());
      });

      expect(onDownload).toHaveBeenCalledWith({
        filename: expect.stringMatching(
          /^csvpreview-export-\d{4}-\d{2}-\d{2}\.csv$/
        ),
        format: "csv",
      });
    });
  });
});
