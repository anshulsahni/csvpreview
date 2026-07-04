import { render, screen } from "@testing-library/react";
import CountPills from "@/app/components/CountPills";

describe("CountPills", () => {
  it("renders total row and column pills when unfiltered", () => {
    render(
      <CountPills
        rowCount={5}
        totalRowCount={5}
        columnCount={3}
        hasActiveFilter={false}
      />
    );

    expect(screen.getByText("5 rows")).toBeInTheDocument();
    expect(screen.getByText("3 columns")).toBeInTheDocument();
  });

  it("renders a visible-of-total row pill when filtered", () => {
    render(
      <CountPills
        rowCount={2}
        totalRowCount={10}
        columnCount={4}
        hasActiveFilter
      />
    );

    expect(screen.getByText("2 of 10 rows")).toBeInTheDocument();
    expect(screen.getByText("4 columns")).toBeInTheDocument();
  });
});
