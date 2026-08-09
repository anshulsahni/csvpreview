import { act, renderHook, waitFor } from "@testing-library/react";
import {
  computeRowWindow,
  useRowVirtualizer,
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

describe("useRowVirtualizer", () => {
  /**
   * jsdom gives every element a zero-height layout box, so the hook can never
   * measure a real viewport there. These helpers stub the two geometry reads
   * the hook depends on (`clientHeight` on the scroller, `getBoundingClientRect`
   * on the measured row) to model a scroller of a given size.
   */
  function makeScroller(clientHeight: number, scrollTop = 0): HTMLElement {
    const el = document.createElement("div");
    Object.defineProperty(el, "clientHeight", {
      value: clientHeight,
      configurable: true,
    });
    el.scrollTop = scrollTop;
    document.body.appendChild(el);
    return el;
  }

  function makeRow(height: number): HTMLElement {
    const el = document.createElement("div");
    el.getBoundingClientRect = () =>
      ({ height, top: 0, bottom: height }) as DOMRect;
    return el;
  }

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("windows to the measured viewport once a scroller is available", () => {
    const scroller = makeScroller(260);
    const ref = { current: scroller };
    const { result } = renderHook(() => useRowVirtualizer(ref, 10000, 2));

    // 260px / 26px rows = 10 visible, plus 2 rows of overscan below.
    expect(result.current.rowWindow.startIndex).toBe(0);
    expect(result.current.rowWindow.endIndex).toBe(12);
    expect(result.current.rowWindow.bottomPadHeight).toBe(
      (10000 - 12) * DEFAULT_ROW_HEIGHT
    );
  });

  it("adopts a measured row height that differs from the fallback", () => {
    const ref = { current: makeScroller(400) };
    const { result } = renderHook(() => useRowVirtualizer(ref, 1000, 2));

    act(() => {
      result.current.measureRef(makeRow(40));
    });

    expect(result.current.rowHeight).toBe(40);
    expect(result.current.rowWindow.endIndex).toBe(Math.ceil(400 / 40) + 2);
  });

  it("ignores sub-pixel jitter in the measured row height", () => {
    const ref = { current: makeScroller(400) };
    const { result } = renderHook(() => useRowVirtualizer(ref, 1000, 2));

    act(() => {
      result.current.measureRef(makeRow(DEFAULT_ROW_HEIGHT + 0.3));
    });

    expect(result.current.rowHeight).toBe(DEFAULT_ROW_HEIGHT);
  });

  it("keeps the fallback height when the row has no layout box", () => {
    const ref = { current: makeScroller(400) };
    const { result } = renderHook(() => useRowVirtualizer(ref, 1000, 2));

    act(() => {
      result.current.measureRef(makeRow(0));
      result.current.measureRef(null);
    });

    expect(result.current.rowHeight).toBe(DEFAULT_ROW_HEIGHT);
  });

  it("moves the window when the scroller is scrolled", async () => {
    const scroller = makeScroller(260);
    const ref = { current: scroller };
    const { result } = renderHook(() => useRowVirtualizer(ref, 10000, 2));

    expect(result.current.rowWindow.startIndex).toBe(0);

    scroller.scrollTop = 5200; // row 200
    act(() => {
      scroller.dispatchEvent(new Event("scroll"));
    });

    await waitFor(() =>
      expect(result.current.rowWindow.startIndex).toBe(200 - 2)
    );
    expect(result.current.rowWindow.topPadHeight).toBe(198 * DEFAULT_ROW_HEIGHT);
  });

  it("recomputes the window when the viewport is resized", async () => {
    const scroller = makeScroller(260);
    const ref = { current: scroller };
    const { result } = renderHook(() => useRowVirtualizer(ref, 10000, 2));

    expect(result.current.rowWindow.endIndex).toBe(12);

    Object.defineProperty(scroller, "clientHeight", {
      value: 520,
      configurable: true,
    });
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    await waitFor(() => expect(result.current.rowWindow.endIndex).toBe(22));
  });

  it("cancels a pending frame and detaches its listeners on unmount", () => {
    const scroller = makeScroller(260);
    const ref = { current: scroller };
    const cancelSpy = jest.spyOn(window, "cancelAnimationFrame");
    const removeSpy = jest.spyOn(scroller, "removeEventListener");

    const { unmount } = renderHook(() => useRowVirtualizer(ref, 10000, 2));

    // Queue a frame that unmount has to clean up.
    scroller.scrollTop = 5200;
    scroller.dispatchEvent(new Event("scroll"));
    unmount();

    expect(cancelSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalledWith("scroll", expect.any(Function));

    cancelSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
