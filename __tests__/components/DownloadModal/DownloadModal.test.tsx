import { render, screen } from "@testing-library/react";
import DownloadModal from "@/app/components/DownloadModal/DownloadModal";

function noop() {}

describe("DownloadModal", () => {
  it("renders the filename input prefilled with the default filename", () => {
    render(
      <DownloadModal
        isOpen
        onClose={noop}
        defaultFilename="csvpreview-export-2026-05-31.csv"
        onDownload={noop}
      />
    );

    expect(
      screen.getByRole("dialog", { name: "Download CSV" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Download filename")).toHaveValue(
      "csvpreview-export-2026-05-31.csv"
    );
  });

  it("returns null when not open", () => {
    const { container } = render(
      <DownloadModal
        isOpen={false}
        onClose={noop}
        defaultFilename="csvpreview-export-2026-05-31.csv"
        onDownload={noop}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
