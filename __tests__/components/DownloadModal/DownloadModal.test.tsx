import { render, screen } from "@testing-library/react";
import DownloadModal from "@/app/components/DownloadModal/DownloadModal";

function noop() {}

describe("DownloadModal", () => {
  it("renders filename input and disabled range option when no selection exists", () => {
    render(
      <DownloadModal
        isOpen
        onClose={noop}
        defaultFilename="csvpreview-export-2026-05-31.csv"
        hasSelection={false}
        onDownload={noop}
      />
    );

    expect(
      screen.getByRole("dialog", { name: "Download CSV" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Download filename")).toHaveValue(
      "csvpreview-export-2026-05-31.csv"
    );
    expect(screen.getByRole("radio", { name: "Full CSV" })).toBeChecked();
    expect(
      screen.getByRole("radio", { name: "Selected range only" })
    ).toBeDisabled();
  });

  it("enables the selected range option and shows the label", () => {
    render(
      <DownloadModal
        isOpen
        onClose={noop}
        defaultFilename="csvpreview-export-2026-05-31.csv"
        hasSelection
        selectionLabel="B2:D4"
        onDownload={noop}
      />
    );

    expect(
      screen.getByRole("radio", { name: "Selected range only - B2:D4" })
    ).toBeEnabled();
  });

  it("returns null when not open", () => {
    const { container } = render(
      <DownloadModal
        isOpen={false}
        onClose={noop}
        defaultFilename="csvpreview-export-2026-05-31.csv"
        hasSelection={false}
        onDownload={noop}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
