import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CsvViewer from "@/app/components/CsvViewer/CsvViewer";
import { ToastProvider } from "@/app/components/Toast";

function renderViewer() {
  return render(
    <ToastProvider>
      <CsvViewer />
    </ToastProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe("CsvViewer (render smoke)", () => {
  it("renders the top-bar Upload button and the grid without crashing", () => {
    const rows = [["Name", "Age"]];
    localStorage.setItem("csvpreview_data", JSON.stringify(rows));
    localStorage.setItem("csvpreview_filename", "people.csv");

    renderViewer();

    expect(screen.getByRole("button", { name: "Upload" })).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
  });

  it("renders the empty state without an infinite update loop", async () => {
    // Regression: `data={viewer.csvData ?? []}` used to mint a new array every
    // render, busting the grid's view-model memo, which re-fired the row
    // selection notify effect, which set state again — "Maximum update depth
    // exceeded". React surfaces that as a thrown error during render.
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => renderViewer()).not.toThrow();

    // The upload modal auto-opens when there is nothing persisted.
    expect(
      await screen.findByRole("dialog", { name: "Upload Data" })
    ).toBeInTheDocument();

    const loopError = consoleError.mock.calls.find((call) =>
      String(call[0] ?? "").includes("Maximum update depth exceeded")
    );
    expect(loopError).toBeUndefined();

    consoleError.mockRestore();
  });

  it("opens the modal when the top-bar Upload button is clicked", async () => {
    const rows = [["a", "b"]];
    localStorage.setItem("csvpreview_data", JSON.stringify(rows));

    renderViewer();

    expect(
      screen.queryByRole("dialog", { name: "Upload Data" })
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Upload" }));

    expect(
      screen.getByRole("dialog", { name: "Upload Data" })
    ).toBeInTheDocument();
  });
});
