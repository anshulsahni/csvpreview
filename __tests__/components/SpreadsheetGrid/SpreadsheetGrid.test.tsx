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

    const ascColA = screen.getAllByRole("button", {
      name: "Sort ascending",
    })[0];
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

    const ascColB = screen.getAllByRole("button", {
      name: "Sort ascending",
    })[1];
    await user.click(ascColB);

    const headers = screen.getAllByRole("columnheader");
    expect(headers[2]).toHaveAttribute("aria-sort", "ascending");
  });
});
