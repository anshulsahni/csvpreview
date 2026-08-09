import {
  computeRowWindow,
  DEFAULT_ROW_HEIGHT,
  ROW_OVERSCAN,
} from "@/app/components/SpreadsheetGrid/useRowVirtualizer";

describe("computeRowWindow", () => {
  it("renders the full range when the viewport height is unknown (SSR / jsdom)", () => {
    const win = computeRowWindow(1000, DEFAULT_ROW_HEIGHT, 0, 0, ROW_OVERSCAN);
    expect(win).toEqual({
      startIndex: 0,
      endIndex: 1000,
      topPadHeight: 0,
      bottomPadHeight: 0,
    });
  });

  it("renders the full range when row height is not yet measured", () => {
    const win = computeRowWindow(500, 0, 120, 400, ROW_OVERSCAN);
    expect(win.startIndex).toBe(0);
    expect(win.endIndex).toBe(500);
  });

  it("returns an empty window for zero rows", () => {
    const win = computeRowWindow(0, DEFAULT_ROW_HEIGHT, 0, 300, ROW_OVERSCAN);
    expect(win).toEqual({
      startIndex: 0,
      endIndex: 0,
      topPadHeight: 0,
      bottomPadHeight: 0,
    });
  });

  it("windows a large row count at the top of the scroll region", () => {
    const rowHeight = 26;
    const win = computeRowWindow(10000, rowHeight, 0, 260, 2);
    // 260 / 26 = 10 visible rows, + overscan below, none above.
    expect(win.startIndex).toBe(0);
    expect(win.endIndex).toBe(12);
    expect(win.topPadHeight).toBe(0);
    expect(win.bottomPadHeight).toBe((10000 - 12) * rowHeight);
  });

  it("windows around the scroll position in the middle of the list", () => {
    const rowHeight = 26;
    const overscan = 5;
    const scrollTop = 5000; // first visible row = floor(5000/26) = 192
    const win = computeRowWindow(10000, rowHeight, scrollTop, 260, overscan);

    const first = Math.floor(scrollTop / rowHeight); // 192
    expect(win.startIndex).toBe(first - overscan); // 187
    expect(win.endIndex).toBe(first + Math.ceil(260 / rowHeight) + overscan); // 192 + 10 + 5
    expect(win.topPadHeight).toBe(win.startIndex * rowHeight);
    expect(win.bottomPadHeight).toBe((10000 - win.endIndex) * rowHeight);
  });

  it("clamps the window to the list bounds near the end", () => {
    const rowHeight = 26;
    const rowCount = 1000;
    const scrollTop = rowCount * rowHeight; // scrolled past the end
    const win = computeRowWindow(rowCount, rowHeight, scrollTop, 260, 4);
    expect(win.endIndex).toBe(rowCount);
    expect(win.bottomPadHeight).toBe(0);
    expect(win.startIndex).toBeLessThan(rowCount);
    expect(win.startIndex).toBeGreaterThanOrEqual(0);
  });

  it("still renders rows when the row count shrinks under a stale scrollTop", () => {
    const rowHeight = 26;
    const rowCount = 20;
    // The scroller still reports a scroll position from a 50k-row dataset.
    const win = computeRowWindow(rowCount, rowHeight, 50000 * rowHeight, 260, 4);

    expect(win.startIndex).toBeLessThan(win.endIndex);
    expect(win.startIndex).toBeGreaterThanOrEqual(0);
    expect(win.endIndex).toBe(rowCount);
    const renderedHeight = (win.endIndex - win.startIndex) * rowHeight;
    expect(win.topPadHeight + renderedHeight + win.bottomPadHeight).toBe(
      rowCount * rowHeight
    );
  });

  it("keeps total reserved height equal to rowCount * rowHeight", () => {
    const rowHeight = 26;
    const rowCount = 4321;
    const win = computeRowWindow(rowCount, rowHeight, 12000, 500, ROW_OVERSCAN);
    const renderedHeight = (win.endIndex - win.startIndex) * rowHeight;
    expect(win.topPadHeight + renderedHeight + win.bottomPadHeight).toBe(
      rowCount * rowHeight
    );
  });
});
