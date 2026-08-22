import {
  applyFiltersWithSourceIndices,
  getUniqueValues,
  matchesNumericFilter,
  type FilterMap,
} from "@/lib/filterUtils";

describe("getUniqueValues", () => {
  it("dedupes and sorts trimmed values", () => {
    const rows = [
      ["  NYC "],
      ["LA"],
      ["nyc"],
      [""],
      ["  "],
      ["LA"],
    ];
    expect(getUniqueValues(rows, 0)).toEqual(["", "LA", "NYC", "nyc"]);
  });
});

describe("matchesNumericFilter", () => {
  it("supports all operators", () => {
    expect(
      matchesNumericFilter("5", { kind: "numeric", op: "=", value: 5 })
    ).toBe(true);
    expect(
      matchesNumericFilter("5", { kind: "numeric", op: "!=", value: 6 })
    ).toBe(true);
    expect(
      matchesNumericFilter("5", { kind: "numeric", op: "<", value: 6 })
    ).toBe(true);
    expect(
      matchesNumericFilter("5", { kind: "numeric", op: "<=", value: 5 })
    ).toBe(true);
    expect(
      matchesNumericFilter("5", { kind: "numeric", op: ">", value: 4 })
    ).toBe(true);
    expect(
      matchesNumericFilter("5", { kind: "numeric", op: ">=", value: 5 })
    ).toBe(true);
  });

  it("returns false for non-numeric cells", () => {
    expect(
      matchesNumericFilter("abc", { kind: "numeric", op: "=", value: 1 })
    ).toBe(false);
  });
});

describe("applyFiltersWithSourceIndices row sharing (CSV-36)", () => {
  const rows = [["NYC"], ["LA"], ["NYC"]];

  it("returns a new outer array but reuses the row arrays when no filter is active", () => {
    const result = applyFiltersWithSourceIndices(rows, [0, 1, 2], {});

    expect(result.rows).not.toBe(rows);
    expect(result.rows).toEqual(rows);
    expect(result.rows[0]).toBe(rows[0]);
    expect(result.rows[1]).toBe(rows[1]);
    expect(result.rows[2]).toBe(rows[2]);
  });

  it("reuses the row arrays of the rows that pass a filter", () => {
    const filters: FilterMap = { 0: { kind: "set", values: new Set(["NYC"]) } };
    const result = applyFiltersWithSourceIndices(rows, [0, 1, 2], filters);

    expect(result.sourceIndices).toEqual([0, 2]);
    expect(result.rows[0]).toBe(rows[0]);
    expect(result.rows[1]).toBe(rows[2]);
  });

  it("leaves the caller's array untouched", () => {
    applyFiltersWithSourceIndices(rows, [0, 1, 2], {});

    expect(rows).toEqual([["NYC"], ["LA"], ["NYC"]]);
  });
});
