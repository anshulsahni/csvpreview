import {
  UPLOAD_ACCEPT_ATTRIBUTE,
  detectUploadFormat,
} from "@/lib/uploadFormats";

describe("UPLOAD_ACCEPT_ATTRIBUTE", () => {
  it("lists every supported extension, comma separated", () => {
    expect(UPLOAD_ACCEPT_ATTRIBUTE).toBe(".csv,.json");
  });
});

describe("detectUploadFormat", () => {
  describe("by extension", () => {
    it("recognises .csv", () => {
      expect(detectUploadFormat("people.csv")).toBe("csv");
    });

    it("recognises .json", () => {
      expect(detectUploadFormat("people.json")).toBe("json");
    });

    it("ignores the case of the extension", () => {
      expect(detectUploadFormat("PEOPLE.CSV")).toBe("csv");
      expect(detectUploadFormat("PEOPLE.JSON")).toBe("json");
    });

    it("wins over a contradicting mime type", () => {
      expect(detectUploadFormat("people.json", "text/csv")).toBe("json");
      expect(detectUploadFormat("people.csv", "application/json")).toBe("csv");
    });
  });

  describe("by mime type", () => {
    it("falls back to the mime type when the extension says nothing", () => {
      expect(detectUploadFormat("people.txt", "text/csv")).toBe("csv");
      expect(detectUploadFormat("people.txt", "application/json")).toBe("json");
      expect(detectUploadFormat("people.txt", "text/json")).toBe("json");
    });

    it("ignores mime type parameters", () => {
      expect(detectUploadFormat("people.txt", "text/csv;charset=utf-8")).toBe(
        "csv"
      );
    });
  });

  describe("unsupported input", () => {
    it("rejects a format we do not parse", () => {
      expect(detectUploadFormat("book.xlsx")).toBeNull();
    });

    it("rejects a bare .txt with no usable mime type", () => {
      expect(detectUploadFormat("notes.txt")).toBeNull();
      expect(detectUploadFormat("notes.txt", "application/octet-stream")).toBeNull();
    });

    it("rejects an empty filename", () => {
      expect(detectUploadFormat("")).toBeNull();
    });
  });
});
