import {
  focusCellAt,
  getActiveCellFromDom,
} from "@/app/components/SpreadsheetGrid/gridDomUtils";

const ROW_HEIGHT = 26;
const HEADER_HEIGHT = 28;
const VIEWPORT_HEIGHT = 260;

/**
 * A miniature stand-in for the virtualized grid. jsdom has no layout, so the
 * geometry `focusCellAt` reads (`getBoundingClientRect`, `clientHeight`) is
 * derived from the row indices currently mounted — which is exactly what the
 * real virtualizer varies. `renderWindow` re-mounts the tbody for a given row
 * range, standing in for a virtualizer commit.
 */
function mountGrid(rowCount: number) {
  const scroller = document.createElement("div");
  scroller.setAttribute("data-grid-scroller", "");
  Object.defineProperty(scroller, "clientHeight", {
    value: VIEWPORT_HEIGHT,
    configurable: true,
  });
  scroller.getBoundingClientRect = () => ({ top: 0, height: VIEWPORT_HEIGHT }) as DOMRect;
  scroller.scrollTop = 0;

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  thead.getBoundingClientRect = () => ({ height: HEADER_HEIGHT }) as DOMRect;
  const tbody = document.createElement("tbody");
  table.append(thead, tbody);
  scroller.appendChild(table);
  document.body.appendChild(scroller);

  function renderWindow(startIndex: number, endIndex: number) {
    tbody.innerHTML = "";
    for (let rowIdx = startIndex; rowIdx < endIndex; rowIdx += 1) {
      const tr = document.createElement("tr");
      for (let colIdx = 0; colIdx < 3; colIdx += 1) {
        const td = document.createElement("td");
        td.tabIndex = 0;
        td.dataset.row = String(rowIdx);
        td.dataset.col = String(colIdx);
        // Content-space top of the row, translated by the current scroll.
        const top = HEADER_HEIGHT + rowIdx * ROW_HEIGHT - scroller.scrollTop;
        td.getBoundingClientRect = () =>
          ({ top, height: ROW_HEIGHT, bottom: top + ROW_HEIGHT }) as DOMRect;
        td.scrollIntoView = jest.fn();
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
  }

  /** Mount the window the virtualizer would pick for the current scrollTop. */
  function renderWindowForScroll() {
    const first = Math.min(
      rowCount - 1,
      Math.max(0, Math.floor(scroller.scrollTop / ROW_HEIGHT))
    );
    const visible = Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT);
    renderWindow(first, Math.min(rowCount, first + visible));
  }

  return { scroller, renderWindow, renderWindowForScroll };
}

function cellAt(rowIdx: number, colIdx: number): HTMLElement | null {
  return document.querySelector(`[data-row="${rowIdx}"][data-col="${colIdx}"]`);
}

/**
 * Wait out the two nested animation frames `focusCellAt` defers its focus into.
 * jsdom drives `requestAnimationFrame` off a ~16ms timer, so this waits well
 * past two of them.
 */
async function flushFrames() {
  await new Promise((resolve) => setTimeout(resolve, 60));
  await new Promise((resolve) => setTimeout(resolve, 60));
}

afterEach(() => {
  document.body.innerHTML = "";
  jest.restoreAllMocks();
});

describe("focusCellAt", () => {
  it("focuses a cell that is already mounted, without deferring", () => {
    const grid = mountGrid(1000);
    grid.renderWindow(0, 10);

    focusCellAt(3, 1);

    expect(document.activeElement).toBe(cellAt(3, 1));
  });

  it("scrolls a virtualized-away row into view and focuses it once it mounts", async () => {
    const grid = mountGrid(1000);
    grid.renderWindow(0, 10);

    // Row 500 is far below the fold, so it isn't in the DOM yet.
    expect(cellAt(500, 2)).toBeNull();

    focusCellAt(500, 2);

    // The scroller was moved toward the target...
    expect(grid.scroller.scrollTop).toBeGreaterThan(0);
    // ...and the virtualizer commits the newly visible window.
    grid.renderWindowForScroll();

    await flushFrames();

    expect(cellAt(500, 2)).not.toBeNull();
    expect(document.activeElement).toBe(cellAt(500, 2));
  });

  it("scrolls back up for a row above the fold and focuses it", async () => {
    const grid = mountGrid(1000);
    grid.scroller.scrollTop = 500 * ROW_HEIGHT;
    grid.renderWindowForScroll();

    focusCellAt(4, 0);

    expect(grid.scroller.scrollTop).toBeLessThan(500 * ROW_HEIGHT);
    grid.renderWindowForScroll();

    await flushFrames();

    expect(document.activeElement).toBe(cellAt(4, 0));
  });

  it("does nothing when the target never mounts", async () => {
    const grid = mountGrid(1000);
    grid.renderWindow(0, 10);
    const before = document.activeElement;

    focusCellAt(900, 0);
    // The virtualizer never commits a window containing row 900.
    await flushFrames();

    expect(document.activeElement).toBe(before);
  });

  it("is a no-op when there is no grid scroller in the document", async () => {
    focusCellAt(5, 0);
    await flushFrames();

    expect(document.activeElement).toBe(document.body);
  });
});

describe("getActiveCellFromDom", () => {
  it("reads the coordinates off the focused cell", () => {
    const grid = mountGrid(100);
    grid.renderWindow(0, 10);
    cellAt(2, 1)?.focus();

    expect(getActiveCellFromDom()).toEqual({ rowIdx: 2, colIdx: 1 });
  });

  it("returns null when the focused element is not a grid cell", () => {
    const button = document.createElement("button");
    document.body.appendChild(button);
    button.focus();

    expect(getActiveCellFromDom()).toBeNull();
  });
});
