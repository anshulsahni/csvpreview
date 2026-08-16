import {
  computeCsvCounts,
  computePillLabels,
} from "@/app/components/CountPills/hooks";

describe("computePillLabels", () => {
  it("shows total rows and columns when no filter is active", () => {
    expect(
      computePillLabels({
        rowCount: 5,
        totalRowCount: 5,
        columnCount: 3,
        hasActiveFilter: false,
      })
    ).toEqual({ rowsLabel: "5 rows", columnsLabel: "3 columns" });
  });

  it("uses singular nouns for a count of one", () => {
    expect(
      computePillLabels({
        rowCount: 1,
        totalRowCount: 1,
        columnCount: 1,
        hasActiveFilter: false,
      })
    ).toEqual({ rowsLabel: "1 row", columnsLabel: "1 column" });
  });

  it("handles zero as plural", () => {
    expect(
      computePillLabels({
        rowCount: 0,
        totalRowCount: 0,
        columnCount: 0,
        hasActiveFilter: false,
      })
    ).toEqual({ rowsLabel: "0 rows", columnsLabel: "0 columns" });
  });

  it("shows visible-of-total for the row label when a filter is active", () => {
    expect(
      computePillLabels({
        rowCount: 120,
        totalRowCount: 5000,
        columnCount: 8,
        hasActiveFilter: true,
      })
    ).toEqual({
      rowsLabel: "120 of 5,000 rows",
      columnsLabel: "8 columns",
    });
  });

  it("formats large numbers with locale thousands separators", () => {
    const labels = computePillLabels({
      rowCount: 1234567,
      totalRowCount: 1234567,
      columnCount: 1000,
      hasActiveFilter: false,
    });

    // Grouping follows the runtime locale — en-US groups 1234567 as
    // "1,234,567", en-IN as "12,34,567" — so the expectation is derived the
    // same way rather than pinned to one locale's separators.
    expect(labels).toEqual({
      rowsLabel: `${(1234567).toLocaleString()} rows`,
      columnsLabel: `${(1000).toLocaleString()} columns`,
    });
    // Derived expectations can't catch the formatting being dropped, so assert
    // the ungrouped digits are absent too.
    expect(labels.rowsLabel).not.toContain("1234567");
  });
});

describe("computeCsvCounts", () => {
  it("returns zeros for empty data", () => {
    expect(computeCsvCounts([], true)).toEqual({
      rowCount: 0,
      totalRowCount: 0,
      columnCount: 0,
      hasActiveFilter: false,
    });
  });

  it("excludes the header row when firstRowAsHeader is true", () => {
    const data = [
      ["Name", "Age"],
      ["Alice", "30"],
      ["Bob", "25"],
    ];
    expect(computeCsvCounts(data, true)).toEqual({
      rowCount: 2,
      totalRowCount: 2,
      columnCount: 2,
      hasActiveFilter: false,
    });
  });

  it("counts every row when firstRowAsHeader is false", () => {
    const data = [
      ["Alice", "30"],
      ["Bob", "25"],
    ];
    expect(computeCsvCounts(data, false)).toEqual({
      rowCount: 2,
      totalRowCount: 2,
      columnCount: 2,
      hasActiveFilter: false,
    });
  });

  it("uses the widest row for the column count on ragged data", () => {
    const data = [
      ["a"],
      ["b", "c", "d"],
      ["e", "f"],
    ];
    expect(computeCsvCounts(data, false).columnCount).toBe(3);
  });

  it("does not go negative when only a header row is present", () => {
    expect(computeCsvCounts([["Name", "Age"]], true).rowCount).toBe(0);
  });
});
