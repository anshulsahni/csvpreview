import { act, renderHook } from "@testing-library/react";
import React from "react";
import {
  computeDefaultFilename,
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
    onClose: jest.fn(),
    defaultFilename: "csvpreview-export-2026-05-31.csv",
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
    it("defaults to the provided filename", () => {
      const { result } = renderHook(() => useDownloadModal(makeArgs()), {
        wrapper,
      });

      expect(result.current.filename).toBe("csvpreview-export-2026-05-31.csv");
    });

    it("submits the edited filename", () => {
      const onDownload = jest.fn();
      const { result } = renderHook(
        () => useDownloadModal(makeArgs({ onDownload })),
        { wrapper }
      );

      act(() => {
        result.current.setFilename("my-export");
      });

      act(() => {
        result.current.handleSubmit(makeSubmitEvent());
      });

      expect(onDownload).toHaveBeenCalledWith({ filename: "my-export.csv" });
    });

    it("falls back to the default filename when the field is blank", () => {
      const onDownload = jest.fn();
      const { result } = renderHook(
        () => useDownloadModal(makeArgs({ onDownload })),
        { wrapper }
      );

      act(() => {
        result.current.setFilename("   ");
      });

      act(() => {
        result.current.handleSubmit(makeSubmitEvent());
      });

      expect(onDownload).toHaveBeenCalledWith({
        filename: expect.stringMatching(/^csvpreview-export-\d{4}-\d{2}-\d{2}\.csv$/),
      });
    });
  });
});
