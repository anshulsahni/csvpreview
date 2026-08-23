import {
  computeScrollTopForRow,
  type ScrollTargetGeometry,
} from "@/app/components/SpreadsheetGrid/scrollUtils";

const ROW_HEIGHT = 26;
const HEADER_HEIGHT = 28;
const VIEWPORT_HEIGHT = 260;

/**
 * A scroller parked at the top with row 0 mounted at the content origin. Each
 * test overrides only the numbers it cares about.
 */
function geometry(
  overrides: Partial<ScrollTargetGeometry> = {}
): ScrollTargetGeometry {
  return {
    targetIdx: 0,
    sampleIdx: 0,
    sampleTop: 0,
    rowHeight: ROW_HEIGHT,
    headerHeight: HEADER_HEIGHT,
    viewTop: 0,
    viewportHeight: VIEWPORT_HEIGHT,
    ...overrides,
  };
}

describe("computeScrollTopForRow", () => {
  it("returns null when the target is already fully in view", () => {
    // Row 4 spans 104..130, clear of the header and well inside the viewport.
    expect(computeScrollTopForRow(geometry({ targetIdx: 4 }))).toBeNull();
  });

  it("scrolls down so the bottom of the target meets the bottom of the viewport", () => {
    // Row 20 sits at 520; it should end up flush with the fold.
    expect(computeScrollTopForRow(geometry({ targetIdx: 20 }))).toBe(
      20 * ROW_HEIGHT + ROW_HEIGHT - VIEWPORT_HEIGHT
    );
  });

  it("scrolls up so the target clears the sticky header", () => {
    // Scrolled to row 100, jumping back to row 40.
    const next = computeScrollTopForRow(
      geometry({
        targetIdx: 40,
        sampleIdx: 100,
        sampleTop: 100 * ROW_HEIGHT,
        viewTop: 100 * ROW_HEIGHT,
      })
    );

    expect(next).toBe(40 * ROW_HEIGHT - HEADER_HEIGHT);
  });

  it("scrolls a row that is on screen but tucked under the sticky header", () => {
    // Row 10 sits at 260, only 10px below viewTop — the header covers it.
    const next = computeScrollTopForRow(
      geometry({ targetIdx: 10, viewTop: 250 })
    );

    expect(next).toBe(10 * ROW_HEIGHT - HEADER_HEIGHT);
  });

  it("clamps to zero rather than scrolling past the top of the content", () => {
    // Row 0 minus the header height would be negative.
    const next = computeScrollTopForRow(
      geometry({ targetIdx: 0, sampleIdx: 40, sampleTop: 40 * ROW_HEIGHT, viewTop: 40 * ROW_HEIGHT })
    );

    expect(next).toBe(0);
  });

  it("extrapolates backwards when the sample row is below the target", () => {
    // Only rows 90+ are mounted; row 50 has to be inferred from row 90.
    const next = computeScrollTopForRow(
      geometry({
        targetIdx: 50,
        sampleIdx: 90,
        sampleTop: 90 * ROW_HEIGHT,
        viewTop: 90 * ROW_HEIGHT,
      })
    );

    expect(next).toBe(50 * ROW_HEIGHT - HEADER_HEIGHT);
  });
});
