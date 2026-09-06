import { act, renderHook } from "@testing-library/react";
import React from "react";
import { KeyboardShortcutsProvider } from "@/app/components/KeyboardShortcuts";
import {
  JSON_DISABLED_REASON,
  computeDownloadFormatOptions,
  computeExtraDownloadOptions,
  computePrimaryDownloadLabel,
  useDownloadControl,
  type UseDownloadControlArgs,
} from "@/app/components/CsvViewer/useDownloadControl";

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(KeyboardShortcutsProvider, null, children);
}

function makeArgs(
  overrides?: Partial<UseDownloadControlArgs>
): UseDownloadControlArgs {
  return {
    hasActiveFilter: false,
    selectedRowCount: 0,
    canDownloadJson: true,
    onDownloadAll: jest.fn(),
    onDownloadSelected: jest.fn(),
    onDownloadFormat: jest.fn(),
    ...overrides,
  };
}

function renderControl(overrides?: Partial<UseDownloadControlArgs>) {
  const args = makeArgs(overrides);
  const { result } = renderHook(() => useDownloadControl(args), { wrapper });
  return { args, result };
}

describe("computePrimaryDownloadLabel", () => {
  it("names the filtered scope only while a filter is active", () => {
    expect(computePrimaryDownloadLabel(false)).toBe("Download");
    expect(computePrimaryDownloadLabel(true)).toBe("Download filtered rows");
  });
});

describe("computeExtraDownloadOptions", () => {
  it("offers nothing extra without a filter or a selection", () => {
    expect(computeExtraDownloadOptions(false, 0)).toEqual([]);
  });

  it("offers the all-rows scope while a filter narrows the view", () => {
    expect(computeExtraDownloadOptions(true, 0)).toEqual([
      { label: "Download all rows", scope: "all" },
    ]);
  });

  it("counts the selected rows and singularizes one row", () => {
    expect(computeExtraDownloadOptions(false, 1)[0].label).toBe(
      "Download selected row (1)"
    );
    expect(computeExtraDownloadOptions(false, 3)[0].label).toBe(
      "Download selected rows (3)"
    );
  });

  it("lists the broader scope first when both apply", () => {
    expect(computeExtraDownloadOptions(true, 2).map((o) => o.scope)).toEqual([
      "all",
      "selected",
    ]);
  });
});

describe("computeDownloadFormatOptions", () => {
  it("builds every entry, in menu order, while a header row exists", () => {
    expect(computeDownloadFormatOptions(true)).toEqual([
      { format: "json", label: "Download as JSON" },
      { format: "tsv", label: "Download as TSV" },
      { format: "psv", label: "Download as Pipe-separated" },
      { format: "ssv", label: "Download as Space-separated" },
    ]);
  });

  it("gives only JSON a reason when there is no header row", () => {
    expect(computeDownloadFormatOptions(false)).toEqual([
      {
        format: "json",
        label: "Download as JSON",
        disabledReason: JSON_DISABLED_REASON,
      },
      { format: "tsv", label: "Download as TSV" },
      { format: "psv", label: "Download as Pipe-separated" },
      { format: "ssv", label: "Download as Space-separated" },
    ]);
  });
});

describe("useDownloadControl", () => {
  it("starts closed and toggles the menu", () => {
    const { result } = renderControl();
    expect(result.current.isMenuOpen).toBe(false);

    act(() => result.current.toggleMenu());
    expect(result.current.isMenuOpen).toBe(true);

    act(() => result.current.toggleMenu());
    expect(result.current.isMenuOpen).toBe(false);
  });

  it("closes the menu on Escape", () => {
    const { result } = renderControl();
    act(() => result.current.toggleMenu());
    expect(result.current.isMenuOpen).toBe(true);

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
      );
    });

    expect(result.current.isMenuOpen).toBe(false);
  });

  it("closes the menu when focus leaves the control", () => {
    const { result } = renderControl();
    act(() => result.current.toggleMenu());

    const outside = document.createElement("button");
    act(() => {
      result.current.handleBlur({
        currentTarget: { contains: () => false },
        relatedTarget: outside,
      } as unknown as React.FocusEvent<HTMLElement>);
    });

    expect(result.current.isMenuOpen).toBe(false);
  });

  it("keeps the menu open while focus moves inside the control", () => {
    const { result } = renderControl();
    act(() => result.current.toggleMenu());

    act(() => {
      result.current.handleBlur({
        currentTarget: { contains: () => true },
        relatedTarget: document.createElement("button"),
      } as unknown as React.FocusEvent<HTMLElement>);
    });

    expect(result.current.isMenuOpen).toBe(true);
  });

  it("routes each scope to its own handler and closes the menu", () => {
    const { args, result } = renderControl({
      hasActiveFilter: true,
      selectedRowCount: 2,
    });
    act(() => result.current.toggleMenu());

    act(() => result.current.handleOptionClick("all"));
    expect(args.onDownloadAll).toHaveBeenCalledTimes(1);
    expect(args.onDownloadSelected).not.toHaveBeenCalled();
    expect(result.current.isMenuOpen).toBe(false);

    act(() => result.current.handleOptionClick("selected"));
    expect(args.onDownloadSelected).toHaveBeenCalledTimes(1);
  });

  it("routes the JSON entry to the handler and closes the menu", () => {
    const { args, result } = renderControl();
    act(() => result.current.toggleMenu());

    act(() =>
      result.current.handleFormatClick({
        format: "json",
        label: "Download as JSON",
      })
    );

    expect(args.onDownloadFormat).toHaveBeenCalledTimes(1);
    expect(args.onDownloadFormat).toHaveBeenCalledWith("json");
    expect(result.current.isMenuOpen).toBe(false);
  });

  it("routes the TSV entry to the handler and closes the menu", () => {
    const { args, result } = renderControl();
    act(() => result.current.toggleMenu());

    act(() =>
      result.current.handleFormatClick({
        format: "tsv",
        label: "Download as TSV",
      })
    );

    expect(args.onDownloadFormat).toHaveBeenCalledTimes(1);
    expect(args.onDownloadFormat).toHaveBeenCalledWith("tsv");
    expect(result.current.isMenuOpen).toBe(false);
  });

  it("routes the pipe-separated entry to the handler and closes the menu", () => {
    const { args, result } = renderControl();
    act(() => result.current.toggleMenu());

    act(() =>
      result.current.handleFormatClick({
        format: "psv",
        label: "Download as Pipe-separated",
      })
    );

    expect(args.onDownloadFormat).toHaveBeenCalledTimes(1);
    expect(args.onDownloadFormat).toHaveBeenCalledWith("psv");
    expect(result.current.isMenuOpen).toBe(false);
  });

  it("routes the space-separated entry to the handler and closes the menu", () => {
    const { args, result } = renderControl();
    act(() => result.current.toggleMenu());

    act(() =>
      result.current.handleFormatClick({
        format: "ssv",
        label: "Download as Space-separated",
      })
    );

    expect(args.onDownloadFormat).toHaveBeenCalledTimes(1);
    expect(args.onDownloadFormat).toHaveBeenCalledWith("ssv");
    expect(result.current.isMenuOpen).toBe(false);
  });

  it("ignores a click on an entry carrying a reason, leaving the menu open", () => {
    const { args, result } = renderControl({ canDownloadJson: false });
    act(() => result.current.toggleMenu());

    act(() =>
      result.current.handleFormatClick({
        format: "json",
        label: "Download as JSON",
        disabledReason: JSON_DISABLED_REASON,
      })
    );

    expect(args.onDownloadFormat).not.toHaveBeenCalled();
    // The menu stays open so the tooltip remains reachable.
    expect(result.current.isMenuOpen).toBe(true);
  });
});
