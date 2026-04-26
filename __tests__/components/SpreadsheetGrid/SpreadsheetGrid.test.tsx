import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SpreadsheetGrid from "@/app/components/SpreadsheetGrid";

describe("SpreadsheetGrid (render smoke)", () => {
  it("with first row as header, shows header text in thead and first body row from data[1]", () => {
    const data = [
      ["Name", "City"],
      ["Alice", "NYC"],
    ];
    render(
      <SpreadsheetGrid data={data} firstRowAsHeader />
    );

    const headers = screen.getAllByRole("columnheader");
    expect(headers.some((el) => el.textContent?.includes("Name"))).toBe(true);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("click Sort ascending on column A reorders first body row", async () => {
    const user = userEvent.setup();
    const data = [
      ["z", "1"],
      ["a", "2"],
    ];
    render(<SpreadsheetGrid data={data} />);

    const ascColA = screen.getByRole("button", {
      name: "Sort column A ascending",
    });
    await user.click(ascColA);

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
    render(<SpreadsheetGrid data={data} />);

    const ascColB = screen.getByRole("button", {
      name: "Sort column B ascending",
    });
    await user.click(ascColB);

    const headers = screen.getAllByRole("columnheader");
    expect(headers[2]).toHaveAttribute("aria-sort", "ascending");
  });

  it("opens one filter dropdown at a time", async () => {
    const user = userEvent.setup();
    const data = [
      ["Alice", "Mumbai"],
      ["Bob", "Delhi"],
    ];
    render(<SpreadsheetGrid data={data} />);

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
    render(<SpreadsheetGrid data={data} />);

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
    render(<SpreadsheetGrid data={data} />);

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
    render(<SpreadsheetGrid data={data} />);

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
    render(<SpreadsheetGrid data={data} />);

    const table = screen.getByRole("table");
    const secondRowGutter = table.querySelector("tbody tr:nth-child(2) th");
    expect(secondRowGutter).not.toBeNull();

    fireEvent.mouseDown(secondRowGutter as Element);

    const rowCells = table.querySelectorAll("tbody tr:nth-child(2) td");
    expect(rowCells[0]).toHaveAttribute("data-selected", "true");
    expect(rowCells[1]).toHaveAttribute("data-selected", "true");
  });

  it("sort arrow click does not trigger column selection", async () => {
    const user = userEvent.setup();
    const data = [
      ["z", "1"],
      ["a", "2"],
    ];
    render(<SpreadsheetGrid data={data} />);

    const ascColA = screen.getByRole("button", {
      name: "Sort column A ascending",
    });
    await user.click(ascColA);

    const table = screen.getByRole("table");
    const firstDataCell = table.querySelector("tbody tr:nth-child(1) td:nth-child(2)");
    expect(firstDataCell).not.toHaveAttribute("data-selected", "true");
  });
});
