import {
  DOWNLOAD_FORMATS,
  ensureExtension,
  stripExtension,
} from "@/lib/downloadFormats";

describe("DOWNLOAD_FORMATS", () => {
  it("gives every format a label, a dotted extension and a MIME type", () => {
    for (const spec of Object.values(DOWNLOAD_FORMATS)) {
      expect(spec.label).not.toBe("");
      expect(spec.extension).toMatch(/^\.[a-z0-9]+$/);
      expect(spec.mimeType).toContain("/");
    }
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
