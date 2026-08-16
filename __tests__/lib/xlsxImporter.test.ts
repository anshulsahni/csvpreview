import { zipSync } from "fflate";
import {
  cellToString,
  parseSheetNamesFromWorkbookXml,
  peekSheetNames,
  sheetRowsToCsv,
} from "@/lib/xlsxImporter";

describe("parseSheetNamesFromWorkbookXml", () => {
  it("returns sheet names in document order", () => {
    const xml =
      '<workbook><sheets>' +
      '<sheet name="Summary" sheetId="1" r:id="rId1"/>' +
      '<sheet name="Q1" sheetId="2" r:id="rId2"/>' +
      '<sheet name="Q2" sheetId="3" r:id="rId3"/>' +
      "</sheets></workbook>";
    expect(parseSheetNamesFromWorkbookXml(xml)).toEqual([
      "Summary",
      "Q1",
      "Q2",
    ]);
  });

  it("handles a single sheet", () => {
    const xml = '<sheets><sheet name="Sheet1" sheetId="1"/></sheets>';
    expect(parseSheetNamesFromWorkbookXml(xml)).toEqual(["Sheet1"]);
  });

  it("decodes XML entities in sheet names", () => {
    const xml =
      '<sheets><sheet name="R&amp;D"/><sheet name="&lt;draft&gt;"/>' +
      '<sheet name="caf&#233;"/></sheets>';
    expect(parseSheetNamesFromWorkbookXml(xml)).toEqual([
      "R&D",
      "<draft>",
      "café",
    ]);
  });

  it("supports namespaced sheet elements", () => {
    const xml = '<x:sheets><x:sheet name="Data" sheetId="1"/></x:sheets>';
    expect(parseSheetNamesFromWorkbookXml(xml)).toEqual(["Data"]);
  });

  it("ignores attributes that merely look like a sheet name", () => {
    const xml = '<sheets><sheet sheetId="1" name="Only"/></sheets>';
    expect(parseSheetNamesFromWorkbookXml(xml)).toEqual(["Only"]);
  });

  it("returns an empty list when there are no sheets", () => {
    expect(parseSheetNamesFromWorkbookXml("<workbook/>")).toEqual([]);
  });
});

describe("cellToString", () => {
  it("renders empty cells as an empty string", () => {
    expect(cellToString(null)).toBe("");
    expect(cellToString(undefined)).toBe("");
  });

  it("renders a date-only value as YYYY-MM-DD", () => {
    expect(cellToString(new Date("2024-03-09T00:00:00.000Z"))).toBe(
      "2024-03-09"
    );
  });

  it("keeps the full ISO timestamp when a time is present", () => {
    expect(cellToString(new Date("2024-03-09T13:45:00.000Z"))).toBe(
      "2024-03-09T13:45:00.000Z"
    );
  });

  it("renders booleans the way Excel displays them", () => {
    expect(cellToString(true)).toBe("TRUE");
    expect(cellToString(false)).toBe("FALSE");
  });

  it("renders numbers plainly", () => {
    expect(cellToString(1234.5)).toBe("1234.5");
    expect(cellToString(0)).toBe("0");
    expect(cellToString(-7)).toBe("-7");
  });

  it("passes strings through untouched", () => {
    expect(cellToString("hello, world")).toBe("hello, world");
    expect(cellToString("")).toBe("");
  });
});

describe("sheetRowsToCsv", () => {
  it("serializes rows with RFC 4180 quoting", () => {
    expect(
      sheetRowsToCsv([
        ["name", "note"],
        ["a", "hello, world"],
      ])
    ).toBe('name,note\na,"hello, world"');
  });
});

describe("peekSheetNames", () => {
  it("lists the worksheet names of an xlsx archive", async () => {
    const file = makeWorkbookFile(["Summary", "Q1"]);
    await expect(peekSheetNames(file)).resolves.toEqual(["Summary", "Q1"]);
  });

  it("rejects a zip that carries no workbook index", async () => {
    const zipped = zipSync({
      "notes.txt": new TextEncoder().encode("hello"),
    });
    await expect(peekSheetNames(new File([zipped], "x.xlsx"))).rejects.toThrow(
      "Not a valid .xlsx workbook"
    );
  });

  it("rejects a file that is not a zip at all", async () => {
    await expect(
      peekSheetNames(new File(["a,b,c"], "data.xlsx"))
    ).rejects.toThrow();
  });
});

/** Build a minimal in-memory `.xlsx` archive carrying just a workbook index. */
function makeWorkbookFile(sheetNames: string[], name = "book.xlsx"): File {
  const sheets = sheetNames
    .map((sheetName, index) => `<sheet name="${sheetName}" sheetId="${index + 1}"/>`)
    .join("");
  const zipped = zipSync({
    "[Content_Types].xml": new TextEncoder().encode("<Types/>"),
    "xl/workbook.xml": new TextEncoder().encode(
      `<workbook><sheets>${sheets}</sheets></workbook>`
    ),
    "xl/worksheets/sheet1.xml": new TextEncoder().encode("<worksheet/>"),
  });
  return new File([zipped], name);
}
