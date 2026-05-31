import { exportCSV } from "@/lib/csvExporter";
import { parseCSV } from "@/lib/csvParser";

describe("exportCSV", () => {
  describe("empty input", () => {
    it("returns empty string for no rows", () => {
      expect(exportCSV([])).toBe("");
    });

    it("returns empty cells joined for a row of empty strings", () => {
      expect(exportCSV([["", "", ""]])).toBe(",,");
    });
  });

  describe("plain rows", () => {
    it("joins cells with the delimiter and rows with newlines", () => {
      expect(exportCSV([["a", "b"], ["c", "d"]])).toBe("a,b\nc,d");
    });

    it("does not append a trailing newline", () => {
      expect(exportCSV([["a"]])).toBe("a");
    });
  });

  describe("RFC 4180 quoting", () => {
    it("quotes cells containing the delimiter", () => {
      expect(exportCSV([["hello, world", "foo"]])).toBe('"hello, world",foo');
    });

    it("quotes and doubles embedded double quotes", () => {
      expect(exportCSV([['say "hello"']])).toBe('"say ""hello"""');
    });

    it("quotes cells containing newlines", () => {
      expect(exportCSV([["line1\nline2", "foo"]])).toBe('"line1\nline2",foo');
    });

    it("quotes cells containing carriage returns", () => {
      expect(exportCSV([["a\rb"]])).toBe('"a\rb"');
    });
  });

  describe("delimiters", () => {
    it("supports the pipe delimiter and only quotes on the active delimiter", () => {
      expect(exportCSV([["a,b", "c"]], "|")).toBe("a,b|c");
      expect(exportCSV([["a|b", "c"]], "|")).toBe('"a|b"|c');
    });

    it("supports the space delimiter", () => {
      expect(exportCSV([["a", "b"]], " ")).toBe("a b");
      expect(exportCSV([["a b", "c"]], " ")).toBe('"a b" c');
    });
  });

  describe("round-trip with parseCSV", () => {
    it.each<[string, string[][]]>([
      ["simple", [["a", "b"], ["c", "d"]]],
      ["quotes and commas", [["hello, world", 'say "hi"']]],
      ["multiline", [["line1\nline2", "foo"], ["bar", "baz"]]],
    ])("re-parses to the original rows (%s)", (_label, rows) => {
      expect(parseCSV(exportCSV(rows)).rows).toEqual(rows);
    });

    it("round-trips with the pipe delimiter", () => {
      const rows = [["a|x", "b"], ["c", "d"]];
      expect(parseCSV(exportCSV(rows, "|"), { delimiter: "|" }).rows).toEqual(
        rows
      );
    });
  });
});
