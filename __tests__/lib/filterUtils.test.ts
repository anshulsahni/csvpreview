import {
  applyFilters,
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

describe("applyFilters", () => {
  const rows = [
    ["Alice", "22", "Mumbai"],
    ["Bob", "28", "Delhi"],
    ["Carol", "31", "Pune"],
    ["Dave", "34", "Chennai"],
    ["Eve", "45", "Bengaluru"],
  ];

  it("returns clone when no filters are active", () => {
    const filters: FilterMap = {};
    const result = applyFilters(rows, filters);
    expect(result).toEqual(rows);
    expect(result).not.toBe(rows);
    expect(result[0]).not.toBe(rows[0]);
  });

  it("filters by set values", () => {
    const filters: FilterMap = {
      2: { kind: "set", values: new Set(["Delhi", "Pune"]) },
    };
    expect(applyFilters(rows, filters)).toEqual([
      ["Bob", "28", "Delhi"],
      ["Carol", "31", "Pune"],
    ]);
  });

  it("filters by numeric operator", () => {
    const filters: FilterMap = {
      1: { kind: "numeric", op: ">=", value: 31 },
    };
    expect(applyFilters(rows, filters)).toEqual([
      ["Carol", "31", "Pune"],
      ["Dave", "34", "Chennai"],
      ["Eve", "45", "Bengaluru"],
    ]);
  });

  it("applies multiple filters with AND semantics", () => {
    const filters: FilterMap = {
      1: { kind: "numeric", op: ">", value: 25 },
      2: { kind: "set", values: new Set(["Pune", "Delhi", "Bengaluru"]) },
    };
    expect(applyFilters(rows, filters)).toEqual([
      ["Bob", "28", "Delhi"],
      ["Carol", "31", "Pune"],
      ["Eve", "45", "Bengaluru"],
    ]);
  });

  it("treats missing column cells as empty strings", () => {
    const raggedRows = [["x"], ["y", "2"], ["z", "3"]];
    const filters: FilterMap = {
      1: { kind: "set", values: new Set([""]) },
    };
    expect(applyFilters(raggedRows, filters)).toEqual([["x"]]);
  });
});
