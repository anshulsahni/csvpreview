import { render, screen } from "@testing-library/react";
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
});
