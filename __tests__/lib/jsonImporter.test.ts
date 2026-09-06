import {
  MAX_SHAPE_ERRORS,
  collectShapeErrors,
  deriveHeaderRow,
  describeJsonType,
  describeSyntaxError,
  jsonValueToCell,
  parseJSON,
} from "@/lib/jsonImporter";
import { exportJSON } from "@/lib/jsonExporter";

describe("parseJSON", () => {
  describe("empty input", () => {
    it.each([
      ["an empty string", ""],
      ["whitespace only", "   \n  "],
      ["an empty array", "[]"],
      ["an array of empty objects", "[{},{}]"],
    ])("returns no rows and no errors for %s", (_label, input) => {
      expect(parseJSON(input)).toEqual({ rows: [], errors: [] });
    });
  });

  describe("convertible input", () => {
    it("puts the object keys in the header row", () => {
      expect(parseJSON('[{"a":1,"b":"x"}]')).toEqual({
        rows: [
          ["a", "b"],
          ["1", "x"],
        ],
        errors: [],
      });
    });

    it("keeps string values verbatim rather than coercing them", () => {
      expect(parseJSON('[{"id":"007"}]').rows).toEqual([["id"], ["007"]]);
    });

    it("preserves unicode and keys containing commas and quotes", () => {
      const { rows } = parseJSON('[{"a,b":"héllo","c\\"d":"—"}]');
      expect(rows).toEqual([
        ['a,b', 'c"d'],
        ["héllo", "—"],
      ]);
    });

    it("takes the union of every record's keys, in first-seen order", () => {
      expect(parseJSON('[{"b":1},{"a":2}]').rows).toEqual([
        ["b", "a"],
        ["1", ""],
        ["", "2"],
      ]);
    });

    it("fills a key a record does not carry with an empty cell", () => {
      expect(parseJSON('[{"id":1,"name":"Ann"},{"id":2}]').rows).toEqual([
        ["id", "name"],
        ["1", "Ann"],
        ["2", ""],
      ]);
    });

    it("keeps the header order JavaScript gives integer-like keys", () => {
      // Object.keys lists integer-like keys first, ascending. Documented, not chosen.
      expect(parseJSON('[{"2":"a","1":"b"}]').rows).toEqual([
        ["1", "2"],
        ["b", "a"],
      ]);
    });

    it("round trips a sheet exported by jsonExporter", () => {
      const json = exportJSON(
        ["id", "name"],
        [
          ["1", "Ann"],
          ["2", "Bob"],
        ]
      );
      expect(parseJSON(json).rows).toEqual([
        ["id", "name"],
        ["1", "Ann"],
        ["2", "Bob"],
      ]);
    });
  });

  describe("malformed input", () => {
    // The engine's wording is neither standardised nor stable, so these assert
    // the shape of the result and never the message text itself.
    it.each([
      ["a truncated document", "{"],
      ["text that is not JSON at all", "hello world"],
      ["a trailing comma", '[{"a":1},{"b":2,,}]'],
    ])("reports exactly one located error for %s", (_label, input) => {
      const { rows, errors } = parseJSON(input);
      expect(rows).toEqual([]);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toMatch(/^Invalid JSON: .+/);
      expect(errors[0].line).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(errors[0].line)).toBe(true);
    });
  });

  describe("incompatible shapes", () => {
    it("rejects a bare object and says how to fix it", () => {
      const { rows, errors } = parseJSON('{"a":1}');
      expect(rows).toEqual([]);
      expect(errors).toEqual([
        {
          line: 0,
          message:
            "Top level must be an array of objects, but found a single object. Wrap it in [ ] to convert one row.",
        },
      ]);
    });

    it("names the path of a nested value", () => {
      const { errors } = parseJSON('[{"a":1,"address":{"city":"X"}}]');
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toMatch(/^\$\[0\]\.address: nested objects/);
    });

    it("reports several violations in document order", () => {
      const { errors } = parseJSON(
        '[{"a":1,"address":{"city":"X"}},{"a":2,"tags":["x"]}]'
      );
      expect(errors.map((error) => error.message)).toEqual([
        expect.stringContaining("$[0].address"),
        expect.stringContaining("$[1].tags"),
      ]);
    });
  });
});

describe("jsonValueToCell", () => {
  it.each([
    ["a string, verbatim", "007", "007"],
    ["an empty string", "", ""],
    ["an integer", 1, "1"],
    ["a negative decimal", -1.5, "-1.5"],
    ["zero", 0, "0"],
    ["true, lower case like the JSON literal", true, "true"],
    ["false, lower case like the JSON literal", false, "false"],
    ["null, as an empty cell", null, ""],
  ])("renders %s", (_label, value, expected) => {
    expect(jsonValueToCell(value as string | number | boolean | null)).toBe(
      expected
    );
  });

  it("uses exponent notation at 1e21, as String does", () => {
    expect(jsonValueToCell(1e21)).toBe("1e+21");
  });

  it("uses exponent notation below 1e-6, as String does", () => {
    expect(jsonValueToCell(1e-7)).toBe("1e-7");
  });

  it("carries the precision JSON.parse already lost above 2^53", () => {
    // Guard, not an endorsement: the digits are gone before this function runs.
    const [value] = JSON.parse("[12345678901234567890]");
    expect(jsonValueToCell(value)).toBe("12345678901234567000");
  });
});

describe("deriveHeaderRow", () => {
  it("returns no keys for no records", () => {
    expect(deriveHeaderRow([])).toEqual([]);
  });

  it("returns no keys when every record is empty", () => {
    expect(deriveHeaderRow([{}, {}])).toEqual([]);
  });

  it("unions keys across records in first-seen order", () => {
    expect(deriveHeaderRow([{ b: 1, a: 2 }, { c: 3 }, { a: 4 }])).toEqual([
      "b",
      "a",
      "c",
    ]);
  });
});

describe("collectShapeErrors", () => {
  it("accepts an array of flat objects", () => {
    expect(collectShapeErrors([{ a: 1 }, { b: "x" }])).toEqual([]);
  });

  it("accepts an empty array", () => {
    expect(collectShapeErrors([])).toEqual([]);
  });

  describe("wrong top level", () => {
    it.each([
      ["a string", "hello", "a string"],
      ["a number", 12, "a number"],
      ["a boolean", true, "a boolean"],
      ["null", null, "null"],
    ])("rejects %s", (_label, value, described) => {
      expect(collectShapeErrors(value)).toEqual([
        {
          line: 0,
          message: `Top level must be an array of objects, but found ${described}.`,
        },
      ]);
    });

    it("rejects a bare object with the wrap-it hint", () => {
      expect(collectShapeErrors({ a: 1 })[0].message).toContain(
        "Wrap it in [ ] to convert one row."
      );
    });
  });

  describe("wrong element", () => {
    it("rejects an array of arrays and says so", () => {
      const [error] = collectShapeErrors([[1, 2]]);
      expect(error.message).toBe(
        "$[0]: expected an object, but found an array. Arrays of arrays are not supported."
      );
    });

    it("rejects a primitive element by index", () => {
      const errors = collectShapeErrors([{ a: 1 }, { a: 2 }, 3]);
      expect(errors).toEqual([
        {
          line: 0,
          message: "$[2]: expected an object, but found a number.",
        },
      ]);
    });

    it("rejects a null element by index", () => {
      const errors = collectShapeErrors([{ a: 1 }, null]);
      expect(errors).toEqual([
        { line: 0, message: "$[1]: expected an object, but found null." },
      ]);
    });
  });

  describe("nested values", () => {
    it("rejects a nested object by path", () => {
      const [error] = collectShapeErrors([{ a: 1, address: { city: "X" } }]);
      expect(error.message).toBe(
        "$[0].address: nested objects are not supported — every value must be a string, number, true, false or null."
      );
    });

    it("rejects a nested array by path", () => {
      const [error] = collectShapeErrors([{}, {}, { tags: ["x"] }]);
      expect(error.message).toBe(
        "$[2].tags: nested arrays are not supported — every value must be a string, number, true, false or null."
      );
    });

    it("does not mistake null for a nested object", () => {
      expect(collectShapeErrors([{ note: null }])).toEqual([]);
    });
  });

  describe("many violations", () => {
    it("caps the list and counts the rest in one summary line", () => {
      const records = Array.from({ length: 500 }, () => ({ a: { b: 1 } }));
      const errors = collectShapeErrors(records);
      expect(errors).toHaveLength(MAX_SHAPE_ERRORS + 1);
      expect(errors.at(-1)).toEqual({
        line: 0,
        message: `…and ${500 - MAX_SHAPE_ERRORS} more issues.`,
      });
    });

    it("adds no summary line when nothing overflowed", () => {
      const records = Array.from({ length: 3 }, () => ({ a: { b: 1 } }));
      expect(collectShapeErrors(records)).toHaveLength(3);
    });
  });
});

describe("describeSyntaxError", () => {
  // Fed literal engine strings so a V8 wording change can never break these.
  describe("V8", () => {
    it("counts the line from the reported character position", () => {
      const input = '[\n {"a":1},\n {"b":2,,}\n]';
      const error = describeSyntaxError(
        "Expected double-quoted property name in JSON at position 20 (line 3 column 9)",
        input
      );
      expect(error.line).toBe(3);
    });

    it("strips the position clause from the message", () => {
      const error = describeSyntaxError(
        "Expected property name or '}' in JSON at position 1 (line 1 column 2)",
        "{"
      );
      expect(error.message).toBe("Invalid JSON: Expected property name or '}'");
    });

    it("strips a position clause that has no parenthesised line", () => {
      const error = describeSyntaxError("Unexpected token at position 5", "abcdefgh");
      expect(error.message).toBe("Invalid JSON: Unexpected token");
      expect(error.line).toBe(1);
    });

    it("keeps the whole message when there is no position at all", () => {
      const error = describeSyntaxError("Unexpected end of JSON input", '[{"a":1},');
      expect(error).toEqual({
        line: 0,
        message: "Invalid JSON: Unexpected end of JSON input",
      });
    });

    it("counts lines correctly through CRLF input", () => {
      const input = '[\r\n {"a":1},\r\n {"b":\r\n]';
      // Position 20 sits on the third line of this CRLF document.
      expect(describeSyntaxError("at position 20", input).line).toBe(3);
    });

    it("clamps a position that runs past the end of the input", () => {
      expect(describeSyntaxError("at position 999", "[]").line).toBe(1);
    });
  });

  describe("other engines", () => {
    it("uses Firefox's explicit line number", () => {
      const error = describeSyntaxError(
        "JSON.parse: unexpected character at line 2 column 3 of the JSON data",
        "[\n]"
      );
      expect(error.line).toBe(2);
      expect(error.message).toBe("Invalid JSON: unexpected character");
    });

    it("falls back to no line for Safari's unlocated message", () => {
      expect(
        describeSyntaxError("JSON Parse error: Unexpected identifier", "x")
      ).toEqual({
        line: 0,
        message: "Invalid JSON: JSON Parse error: Unexpected identifier",
      });
    });
  });
});

describe("describeJsonType", () => {
  it.each([
    ["null", null, "null"],
    ["an array", [], "an array"],
    ["an object", {}, "an object"],
    ["a string", "x", "a string"],
    ["a number", 1, "a number"],
    ["a boolean", false, "a boolean"],
  ])("names %s", (_label, value, expected) => {
    expect(describeJsonType(value)).toBe(expected);
  });
});
