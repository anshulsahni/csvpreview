import { unzipSync } from "fflate";
import { dedupeEntryNames, filesToZipBlob } from "@/lib/zipFiles";

describe("dedupeEntryNames", () => {
  it("leaves already-unique names alone", () => {
    expect(dedupeEntryNames(["a.csv", "b.csv"])).toEqual(["a.csv", "b.csv"]);
  });

  it("suffixes duplicates before the extension", () => {
    expect(dedupeEntryNames(["a.csv", "a.csv", "a.csv"])).toEqual([
      "a.csv",
      "a (2).csv",
      "a (3).csv",
    ]);
  });

  it("treats names case-insensitively", () => {
    expect(dedupeEntryNames(["Sales.csv", "sales.csv"])).toEqual([
      "Sales.csv",
      "sales (2).csv",
    ]);
  });

  it("handles names without an extension", () => {
    expect(dedupeEntryNames(["report", "report"])).toEqual([
      "report",
      "report (2)",
    ]);
  });

  it("does not treat a leading dot as an extension", () => {
    expect(dedupeEntryNames([".csv", ".csv"])).toEqual([".csv", ".csv (2)"]);
  });

  it("returns an empty list unchanged", () => {
    expect(dedupeEntryNames([])).toEqual([]);
  });
});

describe("filesToZipBlob", () => {
  it("produces a non-empty zip blob", () => {
    const blob = filesToZipBlob([
      { name: "a.csv", content: "a,b\n1,2" },
      { name: "b.csv", content: "c,d\n3,4" },
    ]);
    expect(blob.type).toBe("application/zip");
    expect(blob.size).toBeGreaterThan(0);
  });

  it("round-trips entry names and contents", async () => {
    const blob = filesToZipBlob([
      { name: "a.csv", content: "a,b\n1,2" },
      { name: "a.csv", content: "c,d\n3,4" },
    ]);
    const unzipped = unzipSync(new Uint8Array(await blob.arrayBuffer()));
    const decoder = new TextDecoder();

    expect(Object.keys(unzipped).sort()).toEqual(["a (2).csv", "a.csv"]);
    expect(decoder.decode(unzipped["a.csv"])).toBe("a,b\n1,2");
    expect(decoder.decode(unzipped["a (2).csv"])).toBe("c,d\n3,4");
  });

  it("preserves non-ASCII content as UTF-8", async () => {
    const blob = filesToZipBlob([{ name: "u.csv", content: "café,naïve" }]);
    const unzipped = unzipSync(new Uint8Array(await blob.arrayBuffer()));
    expect(new TextDecoder().decode(unzipped["u.csv"])).toBe("café,naïve");
  });
});
