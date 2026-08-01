import { render, screen } from "@testing-library/react";
import LoadingOverlay from "@/app/components/LoadingOverlay";

describe("LoadingOverlay", () => {
  it("exposes a polite, busy status region for assistive tech", () => {
    render(<LoadingOverlay />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("shows the default message and no detail line when none is given", () => {
    render(<LoadingOverlay />);
    expect(screen.getByText("Preparing your sheet…")).toBeInTheDocument();
  });

  it("renders a custom message and detail when provided", () => {
    render(<LoadingOverlay message="Reading your sheet…" detail="big.csv" />);
    expect(screen.getByText("Reading your sheet…")).toBeInTheDocument();
    expect(screen.getByText("big.csv")).toBeInTheDocument();
  });
});
