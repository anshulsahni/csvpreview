import { render, screen } from "@testing-library/react";
import DownloadModal from "@/app/components/DownloadModal/DownloadModal";

function noop() {}

describe("DownloadModal", () => {
  it("renders the filename input prefilled with the default base name", () => {
    render(
      <DownloadModal
        isOpen
        format="csv"
        onClose={noop}
        defaultBaseName="csvpreview-export-2026-05-31"
        onDownload={noop}
      />
    );

    expect(
      screen.getByRole("dialog", { name: "Download CSV" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Download filename")).toHaveValue(
      "csvpreview-export-2026-05-31"
    );
    expect(screen.getByText(".csv")).toBeInTheDocument();
  });

  it("titles itself for the format and locks the matching extension", () => {
    render(
      <DownloadModal
        isOpen
        format="json"
        onClose={noop}
        defaultBaseName="csvpreview-export-2026-05-31"
        onDownload={noop}
      />
    );

    expect(
      screen.getByRole("dialog", { name: "Download JSON" })
    ).toBeInTheDocument();
    // The extension is a read-only chip, not part of the editable value.
    expect(screen.getByLabelText("Download filename")).toHaveValue(
      "csvpreview-export-2026-05-31"
    );
    expect(screen.getByText(".json")).toBeInTheDocument();
  });

  it("returns null when not open", () => {
    const { container } = render(
      <DownloadModal
        isOpen={false}
        format="csv"
        onClose={noop}
        defaultBaseName="csvpreview-export-2026-05-31"
        onDownload={noop}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
