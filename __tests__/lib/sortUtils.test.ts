import {
  compareValues,
  detectColumnType,
  parseFiniteNumber,
  sortRowsWithSourceIndices,
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

describe("sortRowsWithSourceIndices", () => {
  it("reorders the first body row and tracks source indices (CSV-5)", () => {
    const rows = [
      ["first", "b", "c", "300"],
      ["second", "b", "c", "100"],
      ["third", "b", "c", "200"],
    ];
    const sorted = sortRowsWithSourceIndices(rows, [0, 1, 2], 3, "asc");
    expect(sorted.rows[0]).toEqual(["second", "b", "c", "100"]);
    expect(sorted.sourceIndices).toEqual([1, 2, 0]);
  });

  it("moves a blank sort key in the first row to the end (asc)", () => {
    const rows = [
      ["first", "b", "c", ""],
      ["second", "b", "c", "100"],
      ["third", "b", "c", "200"],
    ];
    const sorted = sortRowsWithSourceIndices(rows, [0, 1, 2], 3, "asc");
    expect(sorted.rows[2][0]).toBe("first");
    expect(sorted.sourceIndices[2]).toBe(0);
  });

  it("moves a blank sort key in the first row to the end (desc, CSV-5)", () => {
    const rows = [
      ["first", "b", "c", ""],
      ["second", "b", "c", "100"],
      ["third", "b", "c", "200"],
    ];
    const sorted = sortRowsWithSourceIndices(rows, [0, 1, 2], 3, "desc");
    expect(sorted.rows[2][0]).toBe("first");
    expect(sorted.sourceIndices[2]).toBe(0);
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
