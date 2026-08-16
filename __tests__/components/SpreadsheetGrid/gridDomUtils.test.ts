import {
  focusCellAt,
  getActiveCellFromDom,
} from "@/app/components/SpreadsheetGrid/gridDomUtils";

function cellAt(rowIdx: number, colIdx: number): HTMLElement | null {
  return document.querySelector(`[data-row="${rowIdx}"][data-col="${colIdx}"]`);
}

/** A lone focusable cell — `gridDomUtils` matches on the attribute pair alone. */
function mountCell(rowIdx: number, colIdx: number): HTMLElement {
  const cell = document.createElement("div");
  cell.tabIndex = 0;
  cell.dataset.row = String(rowIdx);
  cell.dataset.col = String(colIdx);
  document.body.appendChild(cell);
  return cell;
}

/**
 * The structure `scrollRowIntoView` walks: a `[data-grid-scroller]` wrapping a
 * `tbody` of cells. `mountRows` swaps the tbody's contents, standing in for a
 * virtualizer commit — which range that is, is the test's own choice, and is
 * deliberately not derived from `computeRowWindow` so this file cannot drift
 * out of sync with the real windowing rule.
 */
function mountScroller() {
  const scroller = document.createElement("div");
  scroller.setAttribute("data-grid-scroller", "");
  const table = scroller.appendChild(document.createElement("table"));
  const tbody = table.appendChild(document.createElement("tbody"));
  document.body.appendChild(scroller);

  return {
    scroller,
    mountRows(startIndex: number, endIndex: number) {
      tbody.innerHTML = "";
      for (let rowIdx = startIndex; rowIdx < endIndex; rowIdx += 1) {
        const tr = tbody.appendChild(document.createElement("tr"));
        for (let colIdx = 0; colIdx < 3; colIdx += 1) {
          const td = tr.appendChild(document.createElement("td"));
          td.tabIndex = 0;
          td.dataset.row = String(rowIdx);
          td.dataset.col = String(colIdx);
        }
      }
    },
  };
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
});

describe("focusCellAt", () => {
  it("focuses a cell that is already mounted, without deferring", () => {
    const cell = mountCell(3, 1);

    focusCellAt(3, 1);

    expect(document.activeElement).toBe(cell);
  });

  it("scrolls a virtualized-away row into view and focuses it once it mounts", async () => {
    const grid = mountScroller();
    grid.mountRows(0, 10);

    // Row 500 is far below the fold, so it isn't in the DOM yet.
    expect(cellAt(500, 2)).toBeNull();

    focusCellAt(500, 2);

    // jsdom has no layout, so every measurement reads zero and the exact
    // scroll target is meaningless here — that arithmetic is covered by
    // `scrollUtils.test.ts`. All this asserts is that the scroller moved
    // toward the target...
    expect(grid.scroller.scrollTop).toBeGreaterThan(0);
    // ...and that focus lands once the virtualizer commits a window with it.
    grid.mountRows(495, 505);

    await flushFrames();

    expect(document.activeElement).toBe(cellAt(500, 2));
  });
});

describe("getActiveCellFromDom", () => {
  it("reads the coordinates off the focused cell", () => {
    mountCell(2, 1).focus();

    expect(getActiveCellFromDom()).toEqual({ rowIdx: 2, colIdx: 1 });
  });

  it("returns null when the focused element is not a grid cell", () => {
    const button = document.createElement("button");
    document.body.appendChild(button);
    button.focus();

    expect(getActiveCellFromDom()).toBeNull();
  });
});
