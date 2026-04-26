import { act, renderHook } from "@testing-library/react";
import {
  cellRangeLabel,
  colLabel,
  computeSpreadsheetGridViewModel,
  getSelectionBounds,
  isCellSelected,
  MIN_COLS,
  MIN_ROWS,
  useFilterState,
  useSpreadsheetGrid,
  useSortState,
} from "@/app/components/SpreadsheetGrid/hooks";

describe("computeSpreadsheetGridViewModel", () => {
  it("header off: bodyRows equals data, no header cells, row numbers start at 1", () => {
    const data = [
      ["a", "b"],
      ["c", "d"],
    ];
    const vm = computeSpreadsheetGridViewModel(data, false);
    expect(vm.headerRowCells).toBeNull();
    expect(vm.bodyRows).toEqual(data);
    expect(vm.rowNumberOffset).toBe(1);
    expect(vm.isEmpty).toBe(false);
  });

  it("header on: first row is header cells, body is slice(1), row numbers start at 2", () => {
    const data = [
      ["Name", "Age"],
      ["Alice", "30"],
    ];
    const vm = computeSpreadsheetGridViewModel(data, true);
    expect(vm.headerRowCells).toEqual(["Name", "Age"]);
    expect(vm.bodyRows).toEqual([["Alice", "30"]]);
    expect(vm.rowNumberOffset).toBe(2);
  });

  it("header on with empty data: empty state, no header row", () => {
    const vm = computeSpreadsheetGridViewModel([], true);
    expect(vm.isEmpty).toBe(true);
    expect(vm.headerRowCells).toBeNull();
    expect(vm.bodyRows).toEqual([]);
    expect(vm.rowNumberOffset).toBe(1);
  });

  it("numCols respects widest row and MIN_COLS floor", () => {
    const data = [["x"]];
    const vm = computeSpreadsheetGridViewModel(data, false);
    expect(vm.numCols).toBe(MIN_COLS);
  });

  it("numCols uses wider rows when present", () => {
    const wide = Array.from({ length: 30 }, () => "x");
    const vm = computeSpreadsheetGridViewModel([wide], false);
    expect(vm.numCols).toBe(30);
  });

  it("numRows pads body to at least MIN_ROWS", () => {
    const data = [["h1"], ["d1"]];
    const vm = computeSpreadsheetGridViewModel(data, true);
    expect(vm.bodyRows.length).toBe(1);
    expect(vm.numRows).toBe(MIN_ROWS);
  });

  it("status hint is empty non-breaking space when data present", () => {
    const vm = computeSpreadsheetGridViewModel([["a"]], false);
    expect(vm.statusHint).toBe("\u00a0");
  });

  it("status hint for empty data", () => {
    const vm = computeSpreadsheetGridViewModel([], false);
    expect(vm.statusHint).toContain("upload");
  });

  it("sort asc on col 0 reorders bodyRows", () => {
    const data = [
      ["b", "y"],
      ["a", "x"],
    ];
    const vm = computeSpreadsheetGridViewModel(data, false, {
      colIdx: 0,
      direction: "asc",
    });
    expect(vm.bodyRows).toEqual([
      ["a", "x"],
      ["b", "y"],
    ]);
    expect(vm.sort).toEqual({ colIdx: 0, direction: "asc" });
  });

  it("status hint shows sorted-by when sort active", () => {
    const vm = computeSpreadsheetGridViewModel([["a"], ["b"]], false, {
      colIdx: 0,
      direction: "asc",
    });
    expect(vm.statusHint).toContain("Sorted by col A asc");
  });

  it("header on: sort applies only to body rows, rowNumberOffset unchanged", () => {
    const data = [
      ["Name", "Age"],
      ["Bob", "2"],
      ["Alice", "1"],
    ];
    const vm = computeSpreadsheetGridViewModel(data, true, {
      colIdx: 0,
      direction: "asc",
    });
    expect(vm.rowNumberOffset).toBe(2);
    expect(vm.bodyRows).toEqual([
      ["Alice", "1"],
      ["Bob", "2"],
    ]);
  });

  it("single active filter shows filtered count status", () => {
    const vm = computeSpreadsheetGridViewModel(
      [
        ["Name", "City"],
        ["Alice", "Mumbai"],
        ["Bob", "Delhi"],
      ],
      true,
      null,
      {
        1: { kind: "set", values: new Set(["Mumbai"]) },
      }
    );
    expect(vm.visibleRowCount).toBe(1);
    expect(vm.totalRowCount).toBe(2);
    expect(vm.statusHint).toContain("Filter active on City");
    expect(vm.statusHint).toContain("Showing 1 of 2 rows");
  });

  it("multiple filters show compact status", () => {
    const vm = computeSpreadsheetGridViewModel(
      [
        ["Alice", "22", "Mumbai"],
        ["Bob", "28", "Delhi"],
        ["Carol", "31", "Pune"],
      ],
      false,
      null,
      {
        1: { kind: "numeric", op: ">=", value: 28 },
        2: { kind: "set", values: new Set(["Delhi", "Pune"]) },
      }
    );
    expect(vm.activeFilterCount).toBe(2);
    expect(vm.visibleRowCount).toBe(2);
    expect(vm.statusHint).toContain("Filters active on 2 columns");
    expect(vm.statusHint).toContain("Showing 2 of 3 rows");
  });

  it("status hint combines filter and sort details", () => {
    const vm = computeSpreadsheetGridViewModel(
      [
        ["Alice", "22"],
        ["Bob", "28"],
        ["Carol", "31"],
      ],
      false,
      { colIdx: 0, direction: "asc" },
      {
        1: { kind: "numeric", op: ">", value: 25 },
      }
    );
    expect(vm.statusHint).toContain("Filter active on B");
    expect(vm.statusHint).toContain("Showing 2 of 3 rows");
    expect(vm.statusHint).toContain("Sorted by col A asc");
  });
});

describe("useSortState", () => {
  it("sets asc, clears on same arrow, switches column/direction", () => {
    const { result } = renderHook(() => useSortState());
    expect(result.current.sort).toBeNull();

    act(() => {
      result.current.onArrowClick(1, "asc");
    });
    expect(result.current.sort).toEqual({ colIdx: 1, direction: "asc" });

    act(() => {
      result.current.onArrowClick(1, "asc");
    });
    expect(result.current.sort).toBeNull();

    act(() => {
      result.current.onArrowClick(1, "asc");
    });
    act(() => {
      result.current.onArrowClick(2, "desc");
    });
    expect(result.current.sort).toEqual({ colIdx: 2, direction: "desc" });
  });
});

describe("useFilterState", () => {
  it("opens one dropdown at a time and sets/clears column filters", () => {
    const { result } = renderHook(() => useFilterState());
    expect(result.current.openColIdx).toBeNull();
    expect(result.current.filters).toEqual({});

    act(() => {
      result.current.openDropdown(2);
    });
    expect(result.current.openColIdx).toBe(2);

    act(() => {
      result.current.openDropdown(3);
    });
    expect(result.current.openColIdx).toBe(3);

    act(() => {
      result.current.setFilter(1, {
        kind: "set",
        values: new Set(["Delhi"]),
      });
    });
    expect(result.current.filters[1]).toEqual({
      kind: "set",
      values: new Set(["Delhi"]),
    });

    act(() => {
      result.current.setFilter(1, null);
      result.current.closeDropdown();
    });
    expect(result.current.filters[1]).toBeUndefined();
    expect(result.current.openColIdx).toBeNull();
  });
});

describe("colLabel", () => {
  it("maps 0,25,26 to A,Z,AA", () => {
    expect(colLabel(0)).toBe("A");
    expect(colLabel(25)).toBe("Z");
    expect(colLabel(26)).toBe("AA");
  });
});

describe("selection helpers", () => {
  it("getSelectionBounds normalizes reversed ranges", () => {
    expect(
      getSelectionBounds({
        anchorRow: 4,
        anchorCol: 3,
        activeRow: 1,
        activeCol: 1,
      })
    ).toEqual({
      top: 1,
      left: 1,
      bottom: 4,
      right: 3,
    });
  });

  it("isCellSelected returns true only within range bounds", () => {
    const selection = {
      anchorRow: 1,
      anchorCol: 1,
      activeRow: 3,
      activeCol: 2,
    };
    expect(isCellSelected(selection, 2, 2)).toBe(true);
    expect(isCellSelected(selection, 0, 2)).toBe(false);
    expect(isCellSelected(selection, 2, 0)).toBe(false);
  });

  it("cellRangeLabel formats single and multi-cell selections", () => {
    expect(
      cellRangeLabel(
        {
          anchorRow: 0,
          anchorCol: 1,
          activeRow: 0,
          activeCol: 1,
        },
        2
      )
    ).toBe("B2");
    expect(
      cellRangeLabel(
        {
          anchorRow: 0,
          anchorCol: 1,
          activeRow: 2,
          activeCol: 3,
        },
        2
      )
    ).toBe("B2:D4");
  });
});

describe("useSpreadsheetGrid selection lifecycle", () => {
  it("clears selection when sort state changes", () => {
    const data = [
      ["b", "2"],
      ["a", "1"],
    ];
    const { result } = renderHook(() =>
      useSpreadsheetGrid({ data, firstRowAsHeader: false })
    );

    act(() => {
      result.current.onCellMouseDown(0, 0);
    });
    expect(result.current.selection).not.toBeNull();

    act(() => {
      result.current.onSortArrowClick(0, "asc");
    });
    expect(result.current.selection).toBeNull();
  });

  it("clears selection when filters change", () => {
    const data = [
      ["Alice", "Mumbai"],
      ["Bob", "Delhi"],
    ];
    const { result } = renderHook(() =>
      useSpreadsheetGrid({ data, firstRowAsHeader: false })
    );

    act(() => {
      result.current.onCellMouseDown(0, 0);
    });
    expect(result.current.selection).not.toBeNull();

    act(() => {
      result.current.setFilter(1, {
        kind: "set",
        values: new Set(["Delhi"]),
      });
    });
    expect(result.current.selection).toBeNull();
  });

  it("clears selection when firstRowAsHeader toggles", () => {
    const data = [
      ["Name", "City"],
      ["Alice", "Mumbai"],
    ];
    const { result, rerender } = renderHook(
      ({ firstRowAsHeader }) =>
        useSpreadsheetGrid({ data, firstRowAsHeader }),
      {
        initialProps: { firstRowAsHeader: false },
      }
    );

    act(() => {
      result.current.onCellMouseDown(0, 0);
    });
    expect(result.current.selection).not.toBeNull();

    rerender({ firstRowAsHeader: true });
    expect(result.current.selection).toBeNull();
  });
});
