import {
  rowsToCopyText,
  selectedCellsToCopyText,
} from "@/lib/clipboardUtils";
import type { CellSelection } from "@/app/components/SpreadsheetGrid/selectionUtils";

describe("rowsToCopyText", () => {
  it("serializes simple rows as CSV", () => {
    expect(rowsToCopyText([["a", "b"], ["c", "d"]])).toBe("a,b\nc,d");
  });

  it("quotes cells containing commas", () => {
    expect(rowsToCopyText([["hello, world", "foo"]])).toBe('"hello, world",foo');
  });

  it("quotes cells containing double quotes", () => {
    expect(rowsToCopyText([['say "hi"']])).toBe('"say ""hi"""');
  });

  it("returns empty string for empty input", () => {
    expect(rowsToCopyText([])).toBe("");
  });

  it("handles a single cell", () => {
    expect(rowsToCopyText([["only"]])).toBe("only");
  });
});

describe("selectedCellsToCopyText", () => {
  const rows = [
    ["a", "b", "c"],
    ["d", "e", "f"],
    ["g", "h", "i"],
  ];

  function sel(
    anchorRow: number,
    anchorCol: number,
    activeRow: number,
    activeCol: number
  ): CellSelection {
    return { anchorRow, anchorCol, activeRow, activeCol };
  }

  it("extracts a single cell", () => {
    expect(selectedCellsToCopyText(rows, sel(1, 1, 1, 1))).toBe("e");
  });

  it("extracts a row range", () => {
    expect(selectedCellsToCopyText(rows, sel(0, 0, 1, 1))).toBe("a,b\nd,e");
  });

  it("extracts a full column range", () => {
    expect(selectedCellsToCopyText(rows, sel(0, 2, 2, 2))).toBe("c\nf\ni");
  });

  it("handles reversed anchor/active (drag up-left)", () => {
    expect(selectedCellsToCopyText(rows, sel(2, 2, 0, 0))).toBe(
      "a,b,c\nd,e,f\ng,h,i"
    );
  });

  it("clamps to available rows when selection exceeds data bounds", () => {
    const result = selectedCellsToCopyText(rows, sel(2, 0, 5, 0));
    expect(result).toBe("g");
  });
});
