import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CsvViewer from "@/app/components/CsvViewer";

beforeEach(() => {
  localStorage.clear();
});

describe("CsvViewer", () => {
  it("renders a CSV file input", () => {
    render(<CsvViewer />);
    expect(document.querySelector('input[accept=".csv"]')).toBeInTheDocument();
  });

  it("does not show Clear button when no file is loaded", () => {
    render(<CsvViewer />);
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
  });

  it("restores saved CSV data from localStorage on mount", () => {
    const rows = [["Name", "Age"], ["Alice", "30"]];
    localStorage.setItem("csvpreview_data", JSON.stringify(rows));
    localStorage.setItem("csvpreview_filename", "people.csv");

    render(<CsvViewer />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("File: people.csv")).toBeInTheDocument();
  });

  it("clears table and localStorage when Clear is clicked", async () => {
    const rows = [["Name", "Age"], ["Alice", "30"]];
    localStorage.setItem("csvpreview_data", JSON.stringify(rows));
    localStorage.setItem("csvpreview_filename", "people.csv");

    render(<CsvViewer />);
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
    expect(localStorage.getItem("csvpreview_data")).toBeNull();
  });

  it("parses an uploaded CSV file and renders a table", async () => {
    const csvContent = "Name,Age\nAlice,30\nBob,25";
    const mockReadAsText = jest.fn();
    const mockReader: Partial<FileReader> & { onload: FileReader["onload"] } = {
      readAsText: mockReadAsText,
      onload: null,
    };
    jest.spyOn(global, "FileReader").mockImplementation(
      () => mockReader as FileReader
    );
    mockReadAsText.mockImplementation(function () {
      (mockReader.onload as EventListener)?.({
        target: { result: csvContent },
      } as unknown as ProgressEvent<FileReader>);
    });

    render(<CsvViewer />);
    const input = document.querySelector('input[accept=".csv"]') as HTMLInputElement;
    await userEvent.upload(input, new File([csvContent], "test.csv", { type: "text/csv" }));

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("File: test.csv")).toBeInTheDocument();

    jest.restoreAllMocks();
  });
});
