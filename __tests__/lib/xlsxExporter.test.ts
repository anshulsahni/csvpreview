import { sanitizeSheetName, makeUniqueSheetNames } from "@/lib/xlsxExporter";

describe("xlsxExporter", () => {
  describe("sanitizeSheetName", () => {
    it("keeps a valid name unchanged", () => {
      expect(sanitizeSheetName("Sales 2026")).toBe("Sales 2026");
    });

    it("replaces Excel-forbidden characters with spaces and collapses them", () => {
      expect(sanitizeSheetName("a/b:c*d?e[f]g\\h")).toBe("a b c d e f g h");
    });

    it("falls back to 'Sheet' for empty or whitespace-only names", () => {
      expect(sanitizeSheetName("")).toBe("Sheet");
      expect(sanitizeSheetName("   ")).toBe("Sheet");
    });

    it("caps the name at 31 characters", () => {
      const long = "a".repeat(40);
      expect(sanitizeSheetName(long)).toBe("a".repeat(31));
    });
  });

  describe("makeUniqueSheetNames", () => {
    it("leaves distinct names untouched", () => {
      expect(makeUniqueSheetNames(["one", "two"])).toEqual(["one", "two"]);
    });

    it("suffixes duplicates", () => {
      expect(makeUniqueSheetNames(["data", "data", "data"])).toEqual([
        "data",
        "data (2)",
        "data (3)",
      ]);
    });

    it("treats names case-insensitively when deduping", () => {
      expect(makeUniqueSheetNames(["Data", "data"])).toEqual(["Data", "data (2)"]);
    });

    it("keeps de-duplicated names within the 31-character limit", () => {
      const long = "x".repeat(31);
      const [first, second] = makeUniqueSheetNames([long, long]);
      expect(first).toBe(long);
      expect(second.length).toBeLessThanOrEqual(31);
      expect(second.endsWith(" (2)")).toBe(true);
    });
  });
});
