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
    hasSelection: false,
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
    it("defaults to full scope and the provided filename", () => {
      const { result } = renderHook(() => useDownloadModal(makeArgs()), {
        wrapper,
      });

      expect(result.current.filename).toBe("csvpreview-export-2026-05-31.csv");
      expect(result.current.scope).toBe("full");
    });

    it("submits the edited filename and selected range scope", () => {
      const onDownload = jest.fn();
      const { result } = renderHook(
        () => useDownloadModal(makeArgs({ hasSelection: true, onDownload })),
        { wrapper }
      );

      act(() => {
        result.current.setFilename("range-export");
        result.current.setScope("range");
      });

      act(() => {
        result.current.handleSubmit(makeSubmitEvent());
      });

      expect(onDownload).toHaveBeenCalledWith({
        filename: "range-export.csv",
        scope: "range",
      });
    });

    it("falls back to full scope when range is selected without a selection", () => {
      const onDownload = jest.fn();
      const { result } = renderHook(
        () => useDownloadModal(makeArgs({ hasSelection: false, onDownload })),
        { wrapper }
      );

      act(() => {
        result.current.setScope("range");
      });

      act(() => {
        result.current.handleSubmit(makeSubmitEvent());
      });

      expect(onDownload).toHaveBeenCalledWith({
        filename: "csvpreview-export-2026-05-31.csv",
        scope: "full",
      });
    });
  });
});
