import { render, screen } from "@testing-library/react";
import Navbar from "@/app/components/Navbar";

describe("Navbar", () => {
  it("renders the brand name", () => {
    render(<Navbar />);
    expect(screen.getByText("CSV Preview")).toBeInTheDocument();
  });

  it("renders the About navigation link", () => {
    render(<Navbar />);
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/about");
  });
});
