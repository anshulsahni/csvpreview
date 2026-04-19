import { render, screen } from "@testing-library/react";
import UploadModal from "@/app/components/UploadModal/UploadModal";

function noop() {}

describe("UploadModal (render smoke)", () => {
  it("renders the expected landmarks when open", () => {
    render(
      <UploadModal
        isOpen
        onClose={noop}
        onFilePicked={noop}
        onPasteSubmit={noop}
        onStartBlank={noop}
        errors={[]}
      />
    );

    expect(screen.getByRole("dialog", { name: "Upload Data" })).toBeInTheDocument();
    expect(
      screen.getByText("Drag a .csv file anywhere in this area")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Accepts: .csv files only" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Paste CSV content")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start with a blank sheet" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Close upload modal" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Choose a .csv file")).toHaveAttribute(
      "accept",
      ".csv"
    );
  });

  it("returns null when not open", () => {
    const { container } = render(
      <UploadModal
        isOpen={false}
        onClose={noop}
        onFilePicked={noop}
        onPasteSubmit={noop}
        onStartBlank={noop}
        errors={[]}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the error panel with line numbers when errors are provided", () => {
    render(
      <UploadModal
        isOpen
        onClose={noop}
        onFilePicked={noop}
        onPasteSubmit={noop}
        onStartBlank={noop}
        errors={[
          { line: 3, message: "bad quote" },
          { line: 7, message: "missing field" },
        ]}
      />
    );

    expect(screen.getByText("Line 3: bad quote")).toBeInTheDocument();
    expect(screen.getByText("Line 7: missing field")).toBeInTheDocument();
  });
});
