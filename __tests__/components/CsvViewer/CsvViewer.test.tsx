import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CsvViewer from "@/app/components/CsvViewer/CsvViewer";

beforeEach(() => {
  localStorage.clear();
});

describe("CsvViewer (render smoke)", () => {
  it("renders the top-bar Upload button and the grid without crashing", () => {
    const rows = [["Name", "Age"]];
    localStorage.setItem("csvpreview_data", JSON.stringify(rows));
    localStorage.setItem("csvpreview_filename", "people.csv");

    render(<CsvViewer />);

    expect(screen.getByRole("button", { name: "Upload" })).toBeInTheDocument();
    expect(screen.getByText("File: people.csv")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
  });

  it("opens the modal when the top-bar Upload button is clicked", async () => {
    const rows = [["a", "b"]];
    localStorage.setItem("csvpreview_data", JSON.stringify(rows));

    render(<CsvViewer />);

    expect(
      screen.queryByRole("dialog", { name: "Upload Data" })
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Upload" }));

    expect(
      screen.getByRole("dialog", { name: "Upload Data" })
    ).toBeInTheDocument();
  });
});
