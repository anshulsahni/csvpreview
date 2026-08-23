import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KeyboardShortcutsProvider } from "@/app/components/KeyboardShortcuts";
import DownloadControl, {
  type DownloadControlProps,
} from "@/app/components/CsvViewer/DownloadControl";

function renderControl(overrides?: Partial<DownloadControlProps>) {
  const props: DownloadControlProps = {
    hasActiveFilter: false,
    selectedRowCount: 0,
    canDownloadJson: true,
    onDownload: jest.fn(),
    onDownloadAll: jest.fn(),
    onDownloadSelected: jest.fn(),
    onDownloadJson: jest.fn(),
    ...overrides,
  };

  render(
    <KeyboardShortcutsProvider>
      <DownloadControl {...props} />
    </KeyboardShortcutsProvider>
  );

  return props;
}

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "More download options" }));
}

describe("DownloadControl", () => {
  it("always offers the dropdown, even with no filter or selection", () => {
    renderControl();

    expect(screen.getByRole("button", { name: "Download" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "More download options" })
    ).toBeInTheDocument();
  });

  it("downloads CSV from the primary button", async () => {
    const user = userEvent.setup();
    const props = renderControl();

    await user.click(screen.getByRole("button", { name: "Download" }));

    expect(props.onDownload).toHaveBeenCalledTimes(1);
    expect(props.onDownloadJson).not.toHaveBeenCalled();
  });

  it("lists the JSON option alongside the scope options", async () => {
    const user = userEvent.setup();
    renderControl({ hasActiveFilter: true, selectedRowCount: 2 });
    await openMenu(user);

    expect(
      screen.getByRole("menuitem", { name: "Download all rows" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Download selected rows (2)" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Download as JSON" })
    ).toBeInTheDocument();
  });

  it("triggers the JSON download when the option is enabled", async () => {
    const user = userEvent.setup();
    const props = renderControl();
    await openMenu(user);

    await user.click(screen.getByRole("menuitem", { name: "Download as JSON" }));

    expect(props.onDownloadJson).toHaveBeenCalledTimes(1);
  });

  it("disables the JSON option with a reason when there is no header row", async () => {
    const user = userEvent.setup();
    const props = renderControl({ canDownloadJson: false });
    await openMenu(user);

    const item = screen.getByRole("menuitem", { name: "Download as JSON" });
    expect(item).toHaveAttribute("aria-disabled", "true");
    expect(item).toHaveAttribute(
      "title",
      'Enable "First row as header" to download JSON'
    );

    await user.click(item);

    expect(props.onDownloadJson).not.toHaveBeenCalled();
  });
});
