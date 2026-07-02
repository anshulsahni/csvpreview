import { parseCSV } from "@/lib/csvParser";

describe("parseCSV", () => {
  describe("empty / blank input", () => {
    it("returns empty rows and no errors for empty string", () => {
      expect(parseCSV("")).toEqual({ rows: [], errors: [] });
    });

    it("returns empty rows for whitespace-only input", () => {
      expect(parseCSV("   ")).toEqual({ rows: [], errors: [] });
    });

    it("returns empty rows for newlines-only input", () => {
      expect(parseCSV("\n\n\n")).toEqual({ rows: [], errors: [] });
    });
  });

  describe("basic comma-delimited parsing", () => {
    it("parses a single row", () => {
      expect(parseCSV("a,b,c").rows).toEqual([["a", "b", "c"]]);
    });

    it("parses multiple rows", () => {
      expect(parseCSV("a,b\nc,d").rows).toEqual([["a", "b"], ["c", "d"]]);
    });

    it("preserves numeric strings as strings (no coercion)", () => {
      expect(parseCSV("1,2.5,03").rows).toEqual([["1", "2.5", "03"]]);
    });

    it("preserves whitespace within cell values", () => {
      expect(parseCSV("hello world, foo ").rows).toEqual([
        ["hello world", " foo "],
      ]);
    });

    it("handles a trailing newline without adding an empty row", () => {
      expect(parseCSV("a,b\nc,d\n").rows).toEqual([["a", "b"], ["c", "d"]]);
    });

    it("uses comma as default delimiter when options is omitted", () => {
      expect(parseCSV("x,y").rows).toEqual([["x", "y"]]);
    });

    it("uses comma as default delimiter when options is empty object", () => {
      expect(parseCSV("x,y", {}).rows).toEqual([["x", "y"]]);
    });
  });

  describe("RFC 4180 quoted fields", () => {
    it("strips quotes from a quoted field", () => {
      expect(parseCSV('"hello"').rows).toEqual([["hello"]]);
    });

    it("preserves delimiter inside quoted field", () => {
      expect(parseCSV('"hello, world",foo').rows).toEqual([
        ["hello, world", "foo"],
      ]);
    });

    it("preserves a pipe inside a comma-quoted field", () => {
      expect(parseCSV('"a|b",c').rows).toEqual([["a|b", "c"]]);
    });

    it("handles mix of quoted and unquoted fields in same row", () => {
      expect(parseCSV('plain,"quoted",plain').rows).toEqual([
        ["plain", "quoted", "plain"],
      ]);
    });
  });

  describe("escaped quotes (RFC 4180 double-quote escaping)", () => {
    it('decodes "" inside a quoted field to a single "', () => {
      expect(parseCSV('"say ""hello"""').rows).toEqual([['say "hello"']]);
    });

    it("handles escaped quotes alongside regular content", () => {
      expect(
        parseCSV('"He said ""Hi"", she said ""Bye"""').rows
      ).toEqual([['He said "Hi", she said "Bye"']]);
    });
  });

  describe("pipe delimiter", () => {
    it("parses pipe-delimited single row", () => {
      expect(parseCSV("a|b|c", { delimiter: "|" }).rows).toEqual([
        ["a", "b", "c"],
      ]);
    });

    it("parses pipe-delimited multiple rows", () => {
      expect(parseCSV("a|b\nc|d", { delimiter: "|" }).rows).toEqual([
        ["a", "b"],
        ["c", "d"],
      ]);
    });

    it("treats comma as literal when pipe is the delimiter", () => {
      expect(parseCSV("a,b|c", { delimiter: "|" }).rows).toEqual([
        ["a,b", "c"],
      ]);
    });

    it("handles quoted fields with pipe delimiter", () => {
      expect(parseCSV('"a|b"|c', { delimiter: "|" }).rows).toEqual([
        ["a|b", "c"],
      ]);
    });
  });

  describe("space delimiter", () => {
    it("parses space-delimited single row", () => {
      expect(parseCSV("a b c", { delimiter: " " }).rows).toEqual([
        ["a", "b", "c"],
      ]);
    });

    it("treats comma as literal when space is the delimiter", () => {
      expect(parseCSV("a,b c", { delimiter: " " }).rows).toEqual([
        ["a,b", "c"],
      ]);
    });
  });

  describe("blank line handling", () => {
    it("skips blank lines between data rows", () => {
      expect(parseCSV("a,b\n\nc,d").rows).toEqual([["a", "b"], ["c", "d"]]);
    });

    it("skips multiple consecutive blank lines", () => {
      expect(parseCSV("a,b\n\n\n\nc,d").rows).toEqual([
        ["a", "b"],
        ["c", "d"],
      ]);
    });

    it("skips whitespace-only lines (greedy mode)", () => {
      expect(parseCSV("a,b\n   \nc,d").rows).toEqual([["a", "b"], ["c", "d"]]);
    });

    it("skips blank lines at the start", () => {
      expect(parseCSV("\n\na,b").rows).toEqual([["a", "b"]]);
    });
  });

  describe("multiline quoted fields", () => {
    it("preserves embedded newline inside a quoted field", () => {
      const input = 'a,"line1\nline2",b';
      expect(parseCSV(input).rows).toEqual([
        ["a", "line1\nline2", "b"],
      ]);
    });

    it("counts as a single row despite embedded newlines", () => {
      const input = '"first\nsecond\nthird"';
      expect(parseCSV(input).rows).toHaveLength(1);
      expect(parseCSV(input).rows[0]).toHaveLength(1);
    });
  });

  describe("error reporting", () => {
    it("returns no errors for valid input", () => {
      expect(parseCSV("a,b\nc,d").errors).toEqual([]);
    });

    it("returns an error with a 1-indexed line number for unclosed quote", () => {
      const result = parseCSV('"unclosed');
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].line).toBe(1);
      expect(typeof result.errors[0].message).toBe("string");
      expect(result.errors[0].message.length).toBeGreaterThan(0);
    });

    it("reports error on correct line when error is not on line 1", () => {
      const input = 'a,b\nc,d\n"unclosed';
      const result = parseCSV(input);
      expect(result.errors[0].line).toBe(3);
    });

    it("still returns partial rows alongside errors (graceful recovery)", () => {
      const result = parseCSV('a,b\n"unclosed');
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("error message is a non-empty string", () => {
      const result = parseCSV('"bad');
      expect(result.errors[0].message).toBeTruthy();
    });
  });

  describe("exact physical line numbers", () => {
    it("accounts for leading blank lines skipped by the parser", () => {
      const input = '\n\na,b\n"unclosed';
      const result = parseCSV(input);
      // Physical lines: 1,2 blank; 3 = a,b; 4 = unclosed quote.
      expect(result.errors.some((e) => e.line === 4)).toBe(true);
    });

    it("accounts for blank lines between data rows", () => {
      const input = 'a,b\n\n\nc,d\n"oops';
      const result = parseCSV(input);
      // Physical line of the unclosed quote is 5.
      expect(result.errors.some((e) => e.line === 5)).toBe(true);
    });

    it("accounts for multi-line quoted fields shifting later line numbers", () => {
      const input = '"a\nb\nc",x\n"unclosed';
      const result = parseCSV(input);
      // The quoted field spans physical lines 1-3; the error is on line 4.
      expect(result.errors.some((e) => e.line === 4)).toBe(true);
    });
  });

  describe("ragged-row (field mismatch) detection", () => {
    it("reports no mismatch when every row has the same column count", () => {
      const result = parseCSV("a,b\nc,d\ne,f");
      expect(result.errors).toEqual([]);
    });

    it("flags a row with too many columns and reports its line and rowIndex", () => {
      const result = parseCSV("a,b\nc,d,e\nf,g");
      const mismatch = result.errors.find((e) => e.rowIndex === 1);
      expect(mismatch).toBeDefined();
      expect(mismatch?.line).toBe(2);
      expect(mismatch?.message).toBe("Expected 2 columns but found 3");
    });

    it("flags a row with too few columns", () => {
      const result = parseCSV("a,b,c\nd,e\nf,g,h");
      const mismatch = result.errors.find((e) => e.rowIndex === 1);
      expect(mismatch).toBeDefined();
      expect(mismatch?.message).toBe("Expected 3 columns but found 2");
    });

    it("uses singular 'column' when the reference row has one column", () => {
      const result = parseCSV("a\nb,c");
      const mismatch = result.errors.find((e) => e.rowIndex === 1);
      expect(mismatch?.message).toBe("Expected 1 column but found 2");
    });

    it("still returns all rows alongside ragged-row errors", () => {
      const result = parseCSV("a,b\nc,d,e\nf,g");
      expect(result.rows).toEqual([
        ["a", "b"],
        ["c", "d", "e"],
        ["f", "g"],
      ]);
    });

    it("computes the correct line for a ragged row after a blank line", () => {
      const result = parseCSV("a,b\n\nc,d,e");
      const mismatch = result.errors.find((e) => e.rowIndex === 1);
      expect(mismatch?.line).toBe(3);
    });
  });

  describe("rowIndex on parse errors", () => {
    it("points at the row in the returned rows array", () => {
      const result = parseCSV('a,b\nc,d\n"unclosed');
      const withRowIndex = result.errors.find(
        (e) => e.rowIndex !== undefined
      );
      expect(withRowIndex?.rowIndex).toBe(2);
      expect(result.rows[withRowIndex!.rowIndex!]).toBeDefined();
    });
  });

  describe("return type contract", () => {
    it("always returns rows as an array (never null or undefined)", () => {
      expect(Array.isArray(parseCSV("").rows)).toBe(true);
      expect(Array.isArray(parseCSV("a,b").rows)).toBe(true);
      expect(Array.isArray(parseCSV('"bad').rows)).toBe(true);
    });

    it("always returns errors as an array (never null or undefined)", () => {
      expect(Array.isArray(parseCSV("").errors)).toBe(true);
      expect(Array.isArray(parseCSV("a,b").errors)).toBe(true);
    });

    it("rows is string[][] — every cell is a string, not a number", () => {
      const result = parseCSV("1,2,3");
      expect(typeof result.rows[0][0]).toBe("string");
    });
  });
});
