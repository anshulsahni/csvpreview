import {
  clampCell,
  findDataBlockEdge,
  lastNonEmptyColInRow,
} from "@/app/components/SpreadsheetGrid/navigationUtils";

describe("clampCell", () => {
  it("returns cell unchanged when within bounds", () => {
    expect(clampCell(2, 3, 10, 10)).toEqual({ rowIdx: 2, colIdx: 3 });
  });

  it("clamps row at top edge", () => {
    expect(clampCell(-1, 0, 10, 10)).toEqual({ rowIdx: 0, colIdx: 0 });
  });

  it("clamps row at bottom edge", () => {
    expect(clampCell(10, 0, 10, 10)).toEqual({ rowIdx: 9, colIdx: 0 });
  });

  it("clamps col at left edge", () => {
    expect(clampCell(0, -1, 10, 10)).toEqual({ rowIdx: 0, colIdx: 0 });
  });

  it("clamps col at right edge", () => {
    expect(clampCell(0, 10, 10, 10)).toEqual({ rowIdx: 0, colIdx: 9 });
  });

  it("clamps both when out of bounds", () => {
    expect(clampCell(-5, 100, 5, 5)).toEqual({ rowIdx: 0, colIdx: 4 });
  });
});

describe("lastNonEmptyColInRow", () => {
  it("returns last non-empty column index", () => {
    const rows = [["a", "b", "c", "", ""]];
    expect(lastNonEmptyColInRow(rows, 0, 5)).toBe(2);
  });

  it("returns 0 when all cells are empty", () => {
    const rows = [["", ""]];
    expect(lastNonEmptyColInRow(rows, 0, 2)).toBe(0);
  });

  it("returns last index when all cells filled", () => {
    const rows = [["a", "b", "c"]];
    expect(lastNonEmptyColInRow(rows, 0, 3)).toBe(2);
  });

  it("ignores whitespace-only cells", () => {
    const rows = [["a", "  ", ""]];
    expect(lastNonEmptyColInRow(rows, 0, 3)).toBe(0);
  });

  it("returns 0 for a row beyond bodyRows length", () => {
    const rows: string[][] = [];
    expect(lastNonEmptyColInRow(rows, 0, 5)).toBe(0);
  });
});

describe("findDataBlockEdge", () => {
  const rows = [
    ["", "", "", "", ""],   // row 0 — empty
    ["", "a", "b", "c", ""], // row 1 — block in cols 1-3
    ["", "d", "e", "f", ""], // row 2 — block in cols 1-3
    ["", "", "", "", ""],   // row 3 — empty
    ["", "g", "", "", ""],  // row 4 — single value
  ];
  const NUM_ROWS = 5;
  const NUM_COLS = 5;

  it("advances to last non-empty cell when both current and next are non-empty", () => {
    // From row 1, col 1 (non-empty), moving right: should land on col 3
    expect(findDataBlockEdge(rows, 1, 1, 0, 1, NUM_ROWS, NUM_COLS)).toEqual({
      rowIdx: 1,
      colIdx: 3,
    });
  });

  it("jumps to first non-empty cell when current is non-empty and next is empty", () => {
    // From row 1, col 3 (non-empty), moving right: next (col 4) is empty, should stay or go to edge
    expect(findDataBlockEdge(rows, 1, 3, 0, 1, NUM_ROWS, NUM_COLS)).toEqual({
      rowIdx: 1,
      colIdx: 4, // grid edge (col 4), no non-empty cells to the right
    });
  });

  it("jumps to first non-empty cell when current is empty", () => {
    // From row 0, col 0 (empty), moving down: should land on row 1 (first non-empty going down in col 0)
    // col 0 is all empty so lands on grid edge row 4
    expect(findDataBlockEdge(rows, 0, 0, 1, 0, NUM_ROWS, NUM_COLS)).toEqual({
      rowIdx: 4,
      colIdx: 0,
    });
  });

  it("jumps to first non-empty downward in a column with data", () => {
    // From row 0, col 1 (empty), moving down: row 1 col 1 is 'a' — first non-empty
    expect(findDataBlockEdge(rows, 0, 1, 1, 0, NUM_ROWS, NUM_COLS)).toEqual({
      rowIdx: 1,
      colIdx: 1,
    });
  });

  it("returns grid edge when no non-empty cell found", () => {
    // From row 4, col 0 (empty), moving down: no more rows → bottom edge
    expect(findDataBlockEdge(rows, 4, 0, 1, 0, NUM_ROWS, NUM_COLS)).toEqual({
      rowIdx: 4,
      colIdx: 0,
    });
  });

  it("clamps to left grid edge when moving left from first col", () => {
    expect(findDataBlockEdge(rows, 1, 0, 0, -1, NUM_ROWS, NUM_COLS)).toEqual({
      rowIdx: 1,
      colIdx: 0,
    });
  });

  it("advances upward through a contiguous block", () => {
    // From row 2, col 1 (non-empty), moving up: row 1 col 1 is also non-empty → lands on row 1
    expect(findDataBlockEdge(rows, 2, 1, -1, 0, NUM_ROWS, NUM_COLS)).toEqual({
      rowIdx: 1,
      colIdx: 1,
    });
  });

  it("jumps to first non-empty below a gap", () => {
    // From row 2, col 1 (non-empty), moving down: row 3 col 1 is empty → scan over gap → row 4 col 1 is 'g'
    expect(findDataBlockEdge(rows, 2, 1, 1, 0, NUM_ROWS, NUM_COLS)).toEqual({
      rowIdx: 4,
      colIdx: 1,
    });
  });
});
