import {
  colLabel,
  computeSpreadsheetGridViewModel,
  MIN_COLS,
  MIN_ROWS,
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
});

describe("colLabel", () => {
  it("maps 0,25,26 to A,Z,AA", () => {
    expect(colLabel(0)).toBe("A");
    expect(colLabel(25)).toBe("Z");
    expect(colLabel(26)).toBe("AA");
  });
});
