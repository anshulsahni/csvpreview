import { render, screen } from "@testing-library/react";
import Navbar from "@/app/components/Navbar";

describe("Navbar", () => {
  it("renders the brand name", () => {
    render(<Navbar />);
    expect(screen.getByText("CSV Preview")).toBeInTheDocument();
  });

  it("renders Home and About navigation links", () => {
    render(<Navbar />);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/about");
  });
});
