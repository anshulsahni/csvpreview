import {
  computeSelectAllState,
  orderedSelectedBodyIndices,
  toggleInSet,
} from "@/app/components/SpreadsheetGrid/rowSelectionUtils";

describe("toggleInSet", () => {
  it("adds an id that is absent", () => {
    const result = toggleInSet(new Set([1, 2]), 3);
    expect([...result].sort()).toEqual([1, 2, 3]);
  });

  it("removes an id that is present", () => {
    const result = toggleInSet(new Set([1, 2, 3]), 2);
    expect([...result].sort()).toEqual([1, 3]);
  });

  it("does not mutate the input set", () => {
    const input = new Set([1]);
    toggleInSet(input, 2);
    expect([...input]).toEqual([1]);
  });
});

describe("computeSelectAllState", () => {
  it("returns 'none' when there are no visible rows", () => {
    expect(computeSelectAllState(new Set([1]), [])).toBe("none");
  });

  it("returns 'none' when no visible row is selected", () => {
    expect(computeSelectAllState(new Set([9]), [0, 1, 2])).toBe("none");
  });

  it("returns 'all' when every visible row is selected", () => {
    expect(computeSelectAllState(new Set([0, 1, 2]), [0, 1, 2])).toBe("all");
  });

  it("returns 'some' when only part of the visible rows are selected", () => {
    expect(computeSelectAllState(new Set([1]), [0, 1, 2])).toBe("some");
  });

  it("ignores selected ids that are not currently visible", () => {
    // 5 is selected but not visible, so all visible (0,1) selected => 'all'.
    expect(computeSelectAllState(new Set([0, 1, 5]), [0, 1])).toBe("all");
  });
});

describe("orderedSelectedBodyIndices", () => {
  it("projects selected ids into display order", () => {
    // display order maps display row -> source body index.
    const displayOrder = [2, 0, 1];
    const result = orderedSelectedBodyIndices(displayOrder, new Set([0, 1]));
    expect(result).toEqual([0, 1]);
  });

  it("only includes ids that are part of the visible display", () => {
    const displayOrder = [3, 1];
    const result = orderedSelectedBodyIndices(displayOrder, new Set([1, 2]));
    expect(result).toEqual([1]);
  });

  it("returns an empty array when nothing is selected", () => {
    expect(orderedSelectedBodyIndices([0, 1, 2], new Set())).toEqual([]);
  });
});
