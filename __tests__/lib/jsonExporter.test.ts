import { exportJSON, rowsToJsonRecords } from "@/lib/jsonExporter";

describe("rowsToJsonRecords", () => {
  describe("empty input", () => {
    it("returns no records for no body rows", () => {
      expect(rowsToJsonRecords(["a", "b"], [])).toEqual([]);
    });

    it("returns empty objects when the header row is empty", () => {
      expect(rowsToJsonRecords([], [["a"], ["b"]])).toEqual([{}, {}]);
    });
  });

  describe("plain rows", () => {
    it("maps each row to an object keyed by the header row", () => {
      expect(
        rowsToJsonRecords(
          ["id", "name"],
          [
            ["1", "Ann"],
            ["2", "Bob"],
          ]
        )
      ).toEqual([
        { id: "1", name: "Ann" },
        { id: "2", name: "Bob" },
      ]);
    });

    it("keeps every value a verbatim string", () => {
      expect(
        rowsToJsonRecords(["code", "flag", "blank"], [["007", "true", ""]])
      ).toEqual([{ code: "007", flag: "true", blank: "" }]);
    });
  });

  describe("ragged rows", () => {
    it("fills missing trailing cells with empty strings", () => {
      expect(rowsToJsonRecords(["id", "name", "email"], [["1", "Ann"]])).toEqual(
        [{ id: "1", name: "Ann", email: "" }]
      );
    });

    it("drops cells beyond the header's width", () => {
      expect(
        rowsToJsonRecords(["id", "name"], [["1", "Ann", "extra", "more"]])
      ).toEqual([{ id: "1", name: "Ann" }]);
    });

    it("gives every record the same shape", () => {
      const records = rowsToJsonRecords(
        ["a", "b", "c"],
        [["1"], ["1", "2"], ["1", "2", "3"]]
      );

      for (const record of records) {
        expect(Object.keys(record)).toEqual(["a", "b", "c"]);
      }
    });
  });

  describe("awkward header rows", () => {
    it("lets the right-most column win when header names repeat", () => {
      expect(rowsToJsonRecords(["id", "name", "id"], [["1", "Ann", "7"]])).toEqual(
        [{ id: "7", name: "Ann" }]
      );
    });

    it("keeps an empty header cell as the empty key", () => {
      expect(rowsToJsonRecords(["id", ""], [["1", "loose"]])).toEqual([
        { id: "1", "": "loose" },
      ]);
    });

    it("does not trim or otherwise rewrite header names", () => {
      expect(rowsToJsonRecords([" id ", "Full Name"], [["1", "Ann"]])).toEqual([
        { " id ": "1", "Full Name": "Ann" },
      ]);
    });
  });
});

describe("exportJSON", () => {
  it("serializes an array of objects with two-space indentation", () => {
    expect(exportJSON(["id"], [["1"]])).toBe(
      '[\n  {\n    "id": "1"\n  }\n]'
    );
  });

  it("serializes an empty body to an empty array", () => {
    expect(exportJSON(["id"], [])).toBe("[]");
  });

  it("does not append a trailing newline", () => {
    expect(exportJSON(["id"], [["1"]]).endsWith("\n")).toBe(false);
  });

  it("produces text that parses back to the same records", () => {
    const headerRow = ["id", "note"];
    const bodyRows = [
      ["1", 'say "hi"'],
      ["2", "line1\nline2"],
    ];

    expect(JSON.parse(exportJSON(headerRow, bodyRows))).toEqual(
      rowsToJsonRecords(headerRow, bodyRows)
    );
  });
});
