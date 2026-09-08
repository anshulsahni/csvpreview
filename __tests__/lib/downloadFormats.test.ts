import {
  DOWNLOAD_FORMATS,
  SECONDARY_DOWNLOAD_FORMATS,
  ensureExtension,
  stripExtension,
} from "@/lib/downloadFormats";

describe("DOWNLOAD_FORMATS", () => {
  // Asserted whole rather than probed field by field: adding a format now fails
  // this test until the entry is written out here, which is the moment to
  // notice a wrong extension or a separator that collides with another format.
  it("describes every format the viewer can write", () => {
    expect(DOWNLOAD_FORMATS).toEqual({
      csv: {
        label: "CSV",
        extension: ".csv",
        mimeType: "text/csv;charset=utf-8",
        delimiter: ",",
      },
      json: {
        label: "JSON",
        extension: ".json",
        mimeType: "application/json;charset=utf-8",
      },
      tsv: {
        label: "TSV",
        extension: ".tsv",
        mimeType: "text/tab-separated-values;charset=utf-8",
        delimiter: "\t",
      },
      psv: {
        label: "Pipe-separated",
        extension: ".psv",
        mimeType: "text/plain;charset=utf-8",
        delimiter: "|",
      },
      ssv: {
        label: "Space-separated",
        extension: ".txt",
        mimeType: "text/plain;charset=utf-8",
        delimiter: " ",
      },
    });
  });

  it("leaves JSON without a separator, which is what marks it non-delimited", () => {
    expect(DOWNLOAD_FORMATS.json.delimiter).toBeUndefined();
  });

  it("maps space-separated onto .txt, the one extension that differs from its key", () => {
    expect(DOWNLOAD_FORMATS.ssv.extension).toBe(".txt");
    expect(DOWNLOAD_FORMATS.tsv.extension).toBe(".tsv");
    expect(DOWNLOAD_FORMATS.psv.extension).toBe(".psv");
  });
});

describe("SECONDARY_DOWNLOAD_FORMATS", () => {
  it("covers every format except the primary CSV, in menu order", () => {
    expect(SECONDARY_DOWNLOAD_FORMATS).toEqual(["json", "tsv", "psv", "ssv"]);
  });

  it("stays in sync with the registry", () => {
    // A format added to the registry but not to the menu list fails here.
    expect(Object.keys(DOWNLOAD_FORMATS)).toEqual([
      "csv",
      ...SECONDARY_DOWNLOAD_FORMATS,
    ]);
  });
});

describe("ensureExtension", () => {
  it("appends the extension when missing", () => {
    expect(ensureExtension("people", ".csv")).toBe("people.csv");
    expect(ensureExtension("people", ".json")).toBe("people.json");
  });

  it("leaves an existing extension alone", () => {
    expect(ensureExtension("people.csv", ".csv")).toBe("people.csv");
  });

  it("matches case-insensitively but preserves the original casing", () => {
    expect(ensureExtension("people.CSV", ".csv")).toBe("people.CSV");
  });

  it("does not confuse a different extension for the target one", () => {
    expect(ensureExtension("people.csv", ".json")).toBe("people.csv.json");
  });

  it("handles a name that is only the extension", () => {
    expect(ensureExtension(".csv", ".csv")).toBe(".csv");
  });
});

describe("stripExtension", () => {
  it("removes a trailing extension", () => {
    expect(stripExtension("people.csv", ".csv")).toBe("people");
  });

  it("matches case-insensitively", () => {
    expect(stripExtension("people.CSV", ".csv")).toBe("people");
  });

  it("leaves a name without the extension untouched", () => {
    expect(stripExtension("people", ".csv")).toBe("people");
    expect(stripExtension("people.json", ".csv")).toBe("people.json");
  });

  it("strips only the last occurrence", () => {
    expect(stripExtension("people.csv.csv", ".csv")).toBe("people.csv");
  });

  it("round-trips with ensureExtension", () => {
    expect(stripExtension(ensureExtension("people", ".json"), ".json")).toBe(
      "people"
    );
  });
});
