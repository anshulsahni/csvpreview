import { render, screen } from "@testing-library/react";
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
});
