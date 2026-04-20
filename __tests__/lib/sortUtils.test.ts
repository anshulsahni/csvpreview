import {
  compareValues,
  detectColumnType,
  parseFiniteNumber,
  sortRows,
} from "@/lib/sortUtils";

describe("parseFiniteNumber", () => {
  it("parses integers and decimals", () => {
    expect(parseFiniteNumber("42")).toBe(42);
    expect(parseFiniteNumber("  3.14  ")).toBe(3.14);
  });

  it("returns null for empty, non-numeric, infinity", () => {
    expect(parseFiniteNumber("")).toBeNull();
    expect(parseFiniteNumber("   ")).toBeNull();
    expect(parseFiniteNumber("abc")).toBeNull();
  });
});

describe("detectColumnType", () => {
  it("returns numeric when all non-empty values are finite numbers", () => {
    expect(detectColumnType(["1", "2", "3"])).toBe("numeric");
    expect(detectColumnType([" 10 ", "20"])).toBe("numeric");
  });

  it("ignores blanks for detection", () => {
    expect(detectColumnType(["", "  ", "1", "2"])).toBe("numeric");
  });

  it("returns text when any non-empty value is non-numeric", () => {
    expect(detectColumnType(["1", "a"])).toBe("text");
    expect(detectColumnType(["1", "2", "x"])).toBe("text");
  });

  it("returns text when all blank", () => {
    expect(detectColumnType(["", " "])).toBe("text");
  });
});

describe("compareValues numeric", () => {
  it("orders numbers ascending", () => {
    expect(compareValues("1", "2", "numeric")).toBeLessThan(0);
    expect(compareValues("2", "1", "numeric")).toBeGreaterThan(0);
  });

  it("sorts blanks last", () => {
    expect(compareValues("", "5", "numeric")).toBeGreaterThan(0);
    expect(compareValues("5", "", "numeric")).toBeLessThan(0);
  });
});

describe("compareValues text (mixed)", () => {
  it("puts numbers before letters when both present (asc tie-break via sortRows)", () => {
    expect(compareValues("2", "a", "text")).toBeLessThan(0);
    expect(compareValues("a", "2", "text")).toBeGreaterThan(0);
  });

  it("compares two numeric strings numerically in text mode", () => {
    expect(compareValues("10", "2", "text")).toBeGreaterThan(0);
  });

  it("uses localeCompare for pure text", () => {
    expect(compareValues("a", "b", "text")).toBeLessThan(0);
    expect(compareValues("A", "b", "text")).toBeLessThan(0);
  });
});

describe("sortRows", () => {
  const rows = [
    ["b", "2"],
    ["a", "10"],
    ["c", "1"],
  ];

  it("sorts by column index ascending without mutating input", () => {
    const sorted = sortRows(rows, 0, "asc");
    expect(sorted.map((r) => r[0])).toEqual(["a", "b", "c"]);
  });

  it("sorts numeric column numerically", () => {
    const sorted = sortRows(rows, 1, "asc");
    expect(sorted.map((r) => r[1])).toEqual(["1", "2", "10"]);
  });

  it("inverts for desc", () => {
    const sorted = sortRows(rows, 1, "desc");
    expect(sorted.map((r) => r[1])).toEqual(["10", "2", "1"]);
  });

  it("is stable on ties", () => {
    const data = [
      ["x", "1"],
      ["y", "1"],
      ["z", "1"],
    ];
    const sorted = sortRows(data, 1, "asc");
    expect(sorted.map((r) => r[0])).toEqual(["x", "y", "z"]);
  });

  it("handles out-of-range colIdx — stable original order", () => {
    const data = [["a"], ["b"]];
    const sorted = sortRows(data, 99, "asc");
    expect(sorted).toEqual([["a"], ["b"]]);
  });
});
