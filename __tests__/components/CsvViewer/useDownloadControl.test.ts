import { act, renderHook } from "@testing-library/react";
import React from "react";
import { KeyboardShortcutsProvider } from "@/app/components/KeyboardShortcuts";
import {
  JSON_DISABLED_REASON,
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
    onDownloadJson: jest.fn(),
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

  it("reports no reason and runs the JSON download while it is available", () => {
    const { args, result } = renderControl();
    expect(result.current.jsonDisabledReason).toBeUndefined();

    act(() => result.current.toggleMenu());
    act(() => result.current.handleJsonClick());

    expect(args.onDownloadJson).toHaveBeenCalledTimes(1);
    expect(result.current.isMenuOpen).toBe(false);
  });

  it("gives a reason and ignores clicks while JSON is unavailable", () => {
    const { args, result } = renderControl({ canDownloadJson: false });
    expect(result.current.jsonDisabledReason).toBe(JSON_DISABLED_REASON);

    act(() => result.current.toggleMenu());
    act(() => result.current.handleJsonClick());

    expect(args.onDownloadJson).not.toHaveBeenCalled();
    // The menu stays open so the tooltip remains reachable.
    expect(result.current.isMenuOpen).toBe(true);
  });
});
