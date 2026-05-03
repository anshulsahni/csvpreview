import {
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
