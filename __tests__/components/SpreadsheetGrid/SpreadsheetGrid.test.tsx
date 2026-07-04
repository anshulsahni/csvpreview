import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ReactElement } from "react";
import { KeyboardShortcutsProvider } from "@/app/components/KeyboardShortcuts";
import SpreadsheetGrid from "@/app/components/SpreadsheetGrid";

function renderWithShortcuts(ui: ReactElement) {
  return render(<KeyboardShortcutsProvider>{ui}</KeyboardShortcutsProvider>);
}

function EditableGridHarness({
  initialData,
  firstRowAsHeader = false,
}: {
  initialData: string[][];
  firstRowAsHeader?: boolean;
}) {
  const [data, setData] = useState(initialData);
  return (
    <SpreadsheetGrid
      data={data}
      firstRowAsHeader={firstRowAsHeader}
      onCellChange={(rowIdx, colIdx, value) => {
        setData((prev) => {
          const next = prev.map((row) => row.slice());
          while (next.length <= rowIdx) next.push([]);
          while ((next[rowIdx] ?? []).length <= colIdx) {
            (next[rowIdx] ?? []).push("");
          }
          next[rowIdx]![colIdx] = value;
          return next;
        });
      }}
    />
  );
}

describe("SpreadsheetGrid (render smoke)", () => {
  it("with first row as header, shows header text in thead and first body row from data[1]", () => {
    const data = [
      ["Name", "City"],
      ["Alice", "NYC"],
    ];
    renderWithShortcuts(
      <SpreadsheetGrid data={data} firstRowAsHeader />
    );

    const headers = screen.getAllByRole("columnheader");
    expect(headers.some((el) => el.textContent?.includes("Name"))).toBe(true);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("click sort on column A once (ascending) reorders first body row", async () => {
    const user = userEvent.setup();
    const data = [
      ["z", "1"],
      ["a", "2"],
    ];
    renderWithShortcuts(<SpreadsheetGrid data={data} />);

    const sortColA = screen.getByRole("button", {
      name: "Sort column A",
    });
    await user.click(sortColA);

    const table = screen.getByRole("table");
    const firstBodyRow = table.querySelector("tbody tr");
    const firstDataCell = firstBodyRow?.querySelectorAll("td")[0];
    expect(firstDataCell?.textContent).toBe("a");
  });

  it("active sort column header exposes aria-sort", async () => {
    const user = userEvent.setup();
    const data = [
      ["a", "b"],
      ["c", "d"],
    ];
    renderWithShortcuts(<SpreadsheetGrid data={data} />);

    const sortColB = screen.getByRole("button", {
      name: "Sort column B",
    });
    await user.click(sortColB);

    const headers = screen.getAllByRole("columnheader");
    expect(headers[2]).toHaveAttribute("aria-sort", "ascending");
  });

  it("opens one filter dropdown at a time", async () => {
    const user = userEvent.setup();
    const data = [
      ["Alice", "Mumbai"],
      ["Bob", "Delhi"],
    ];
    renderWithShortcuts(<SpreadsheetGrid data={data} />);

    const filterA = screen.getAllByRole("button", {
      name: "Filter column A",
    })[0];
    const filterB = screen.getAllByRole("button", {
      name: "Filter column B",
    })[0];

    await user.click(filterA);
    expect(screen.getByRole("dialog", { name: "Filter A" })).toBeInTheDocument();

    await user.click(filterB);
    expect(screen.queryByRole("dialog", { name: "Filter A" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Filter B" })).toBeInTheDocument();
  });

  it("applies a set filter and reduces visible rows", async () => {
    const user = userEvent.setup();
    const data = [
      ["Alice", "Mumbai"],
      ["Bob", "Delhi"],
      ["Carol", "Pune"],
    ];
    renderWithShortcuts(<SpreadsheetGrid data={data} />);

    const filterCity = screen.getAllByRole("button", {
      name: "Filter column B",
    })[0];
    await user.click(filterCity);

    await user.click(screen.getByRole("checkbox", { name: "Delhi" }));
    await user.click(screen.getByRole("checkbox", { name: "Pune" }));
    await user.click(screen.getByRole("button", { name: "Apply Filter" }));

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText(/Showing 1 of 3 rows/)).toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
    expect(screen.queryByText("Carol")).not.toBeInTheDocument();
  });

  it("mouse drag selects a rectangular range and shows selection status", () => {
    const data = [
      ["A1", "B1"],
      ["A2", "B2"],
    ];
    renderWithShortcuts(<SpreadsheetGrid data={data} />);

    const table = screen.getByRole("table");
    const firstCell = table.querySelector("tbody tr:nth-child(1) td:nth-child(2)");
    const secondRowSecondCol = table.querySelector(
      "tbody tr:nth-child(2) td:nth-child(3)"
    );

    expect(firstCell).not.toBeNull();
    expect(secondRowSecondCol).not.toBeNull();

    fireEvent.mouseDown(firstCell as Element);
    fireEvent.mouseEnter(secondRowSecondCol as Element);
    fireEvent.mouseUp(window);

    expect(firstCell).toHaveAttribute("data-selected", "true");
    expect(secondRowSecondCol).toHaveAttribute("data-selected", "true");
    expect(screen.getByText(/4 cells selected \(A1:B2\)/)).toBeInTheDocument();
  });

  it("mousedown on column header selects whole visible column", () => {
    const data = [
      ["r1c1", "r1c2"],
      ["r2c1", "r2c2"],
      ["r3c1", "r3c2"],
    ];
    renderWithShortcuts(<SpreadsheetGrid data={data} />);

    const headers = screen.getAllByRole("columnheader");
    fireEvent.mouseDown(headers[2]);

    const table = screen.getByRole("table");
    const cells = table.querySelectorAll("tbody td:nth-child(3)");
    expect(cells[0]).toHaveAttribute("data-selected", "true");
    expect(cells[1]).toHaveAttribute("data-selected", "true");
    expect(cells[2]).toHaveAttribute("data-selected", "true");
  });

  it("mousedown on row gutter selects whole row", () => {
    const data = [
      ["r1c1", "r1c2"],
      ["r2c1", "r2c2"],
    ];
    renderWithShortcuts(<SpreadsheetGrid data={data} />);

    const table = screen.getByRole("table");
    const secondRowGutter = table.querySelector("tbody tr:nth-child(2) th");
    expect(secondRowGutter).not.toBeNull();

    fireEvent.mouseDown(secondRowGutter as Element);

    const rowCells = table.querySelectorAll("tbody tr:nth-child(2) td");
    expect(rowCells[0]).toHaveAttribute("data-selected", "true");
    expect(rowCells[1]).toHaveAttribute("data-selected", "true");
  });

  it("shows aggregate stats in status bar for numeric selection", () => {
    const data = [
      ["1", "2"],
      ["3", "4"],
    ];
    renderWithShortcuts(<SpreadsheetGrid data={data} />);

    const table = screen.getByRole("table");
    const firstCell = table.querySelector("tbody tr:nth-child(1) td:nth-child(2)");
    const secondRowSecondCol = table.querySelector(
      "tbody tr:nth-child(2) td:nth-child(3)"
    );

    expect(firstCell).not.toBeNull();
    expect(secondRowSecondCol).not.toBeNull();

    fireEvent.mouseDown(firstCell as Element);
    fireEvent.mouseEnter(secondRowSecondCol as Element);
    fireEvent.mouseUp(window);

    expect(screen.getByText(/Sum: 10/)).toBeInTheDocument();
    expect(screen.getByText(/Avg: 2.5/)).toBeInTheDocument();
    expect(screen.getByText(/Min: 1/)).toBeInTheDocument();
    expect(screen.getByText(/Max: 4/)).toBeInTheDocument();
  });

  it("hides aggregate stats when fewer than two numeric cells are selected", () => {
    const data = [
      ["foo", "bar"],
      ["baz", "7"],
    ];
    renderWithShortcuts(<SpreadsheetGrid data={data} />);

    const table = screen.getByRole("table");
    const firstCell = table.querySelector("tbody tr:nth-child(1) td:nth-child(2)");
    const secondRowSecondCol = table.querySelector(
      "tbody tr:nth-child(2) td:nth-child(3)"
    );

    expect(firstCell).not.toBeNull();
    expect(secondRowSecondCol).not.toBeNull();

    fireEvent.mouseDown(firstCell as Element);
    fireEvent.mouseEnter(secondRowSecondCol as Element);
    fireEvent.mouseUp(window);

    expect(screen.queryByText(/Sum:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Avg:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Min:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Max:/)).not.toBeInTheDocument();
  });

  it("sort button click does not trigger column selection", async () => {
    const user = userEvent.setup();
    const data = [
      ["z", "1"],
      ["a", "2"],
    ];
    renderWithShortcuts(<SpreadsheetGrid data={data} />);

    const sortColA = screen.getByRole("button", {
      name: "Sort column A",
    });
    await user.click(sortColA);

    const table = screen.getByRole("table");
    const firstDataCell = table.querySelector("tbody tr:nth-child(1) td:nth-child(2)");
    expect(firstDataCell).not.toHaveAttribute("data-selected", "true");
  });

  it("double-click opens editor and Enter commits then moves down", async () => {
    const user = userEvent.setup();
    renderWithShortcuts(<EditableGridHarness initialData={[["A1", "B1"], ["A2", "B2"]]} />);

    const table = screen.getByRole("table");
    const cellA1 = table.querySelector("tbody tr:nth-child(1) td:nth-child(2)");
    const cellA2 = table.querySelector("tbody tr:nth-child(2) td:nth-child(2)");
    expect(cellA1).not.toBeNull();
    expect(cellA2).not.toBeNull();

    await user.dblClick(cellA1 as Element);
    const textarea = screen.getByRole("textbox");
    await user.clear(textarea);
    await user.type(textarea, "Edited{enter}");

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect((cellA1 as Element).textContent).toContain("Edited");
    expect(cellA2).toHaveAttribute("data-selected", "true");
  });

  it("Shift+Enter inserts newline and Escape commits without moving", async () => {
    const user = userEvent.setup();
    renderWithShortcuts(<EditableGridHarness initialData={[["A1", "B1"]]} />);

    const table = screen.getByRole("table");
    const cellA1 = table.querySelector("tbody tr:nth-child(1) td:nth-child(2)");
    expect(cellA1).not.toBeNull();

    await user.dblClick(cellA1 as Element);
    const textarea = screen.getByRole("textbox");
    await user.clear(textarea);
    await user.type(textarea, "Line1{shift>}{enter}{/shift}Line2{escape}");

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    // TODO: add assertion for detecting new line also, currently can't do, because
    // in view mode, new line isn't presented as newline to user
    expect((cellA1 as Element).textContent).toContain("Line1");
    expect((cellA1 as Element).textContent).toContain("Line2");
    expect(cellA1).toHaveAttribute("data-selected", "true");
  });

  it("Tab commits and moves focus/selection right", async () => {
    const user = userEvent.setup();
    renderWithShortcuts(<EditableGridHarness initialData={[["A1", "B1"]]} />);

    const table = screen.getByRole("table");
    const cellA1 = table.querySelector("tbody tr:nth-child(1) td:nth-child(2)");
    const cellB1 = table.querySelector("tbody tr:nth-child(1) td:nth-child(3)");
    expect(cellA1).not.toBeNull();
    expect(cellB1).not.toBeNull();

    await user.dblClick(cellA1 as Element);
    const textarea = screen.getByRole("textbox");
    await user.clear(textarea);
    await user.type(textarea, "AX{tab}");

    expect(screen.getByText("AX")).toBeInTheDocument();
    expect(cellB1).toHaveAttribute("data-selected", "true");
  });

  it("places the cursor at the end when entering edit mode", async () => {
    const user = userEvent.setup();
    renderWithShortcuts(<EditableGridHarness initialData={[["Existing"]]} />);

    const table = screen.getByRole("table");
    const cellA1 = table.querySelector("tbody tr:nth-child(1) td:nth-child(2)");
    expect(cellA1).not.toBeNull();

    await user.dblClick(cellA1 as Element);

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea.selectionStart).toBe("Existing".length);
    expect(textarea.selectionEnd).toBe("Existing".length);
  });

  it("clicking another cell commits the active edit and selects the clicked cell", async () => {
    const user = userEvent.setup();
    renderWithShortcuts(<EditableGridHarness initialData={[["A1", "B1"], ["A2", "B2"]]} />);

    const table = screen.getByRole("table");
    const cellA1 = table.querySelector("tbody tr:nth-child(1) td:nth-child(2)");
    const cellB2 = table.querySelector("tbody tr:nth-child(2) td:nth-child(3)");
    expect(cellA1).not.toBeNull();
    expect(cellB2).not.toBeNull();

    await user.dblClick(cellA1 as Element);
    const textarea = screen.getByRole("textbox");
    await user.clear(textarea);
    await user.type(textarea, "Committed on click");
    await user.click(cellB2 as Element);

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect((cellA1 as Element).textContent).toContain("Committed on click");
    expect(cellB2).toHaveAttribute("data-selected", "true");
  });

  describe("rowErrors highlighting", () => {
    it("marks the flagged data row and leaves clean rows unmarked", () => {
      const data = [
        ["a", "b"],
        ["c", "d", "e"],
        ["f", "g"],
      ];
      renderWithShortcuts(
        <SpreadsheetGrid
          data={data}
          rowErrors={new Map([[1, "Expected 2 columns but found 3"]])}
        />
      );

      const table = screen.getByRole("table");
      const bodyRows = table.querySelectorAll("tbody tr");
      const flaggedCell = bodyRows[1]?.querySelector("td");
      const cleanCell = bodyRows[0]?.querySelector("td");

      expect(flaggedCell).toHaveAttribute("data-error", "true");
      expect(flaggedCell).toHaveAttribute(
        "title",
        "Expected 2 columns but found 3"
      );
      expect(cleanCell).not.toHaveAttribute("data-error");
    });

    it("keeps the highlight on the correct row after sorting", async () => {
      const user = userEvent.setup();
      // Row index 1 ("c") is flagged; sorting column A desc moves it to the top.
      const data = [
        ["a"],
        ["c"],
        ["b"],
      ];
      renderWithShortcuts(
        <SpreadsheetGrid data={data} rowErrors={new Map([[1, "bad row"]])} />
      );

      // First click → ascending, second click → descending.
      const sortColA = screen.getByRole("button", { name: "Sort column A" });
      await user.click(sortColA);
      await user.click(sortColA);

      const table = screen.getByRole("table");
      const firstBodyRow = table.querySelector("tbody tr");
      const firstCell = firstBodyRow?.querySelector("td");
      // After desc sort the flagged "c" is first and stays flagged.
      expect(firstCell?.textContent).toBe("c");
      expect(firstCell).toHaveAttribute("data-error", "true");
    });
  });
});
