import { render, screen, fireEvent } from "@testing-library/react";
import CsvToExcelConverter from "@/app/tools/csv-to-excel/components/CsvToExcelConverter/CsvToExcelConverter";
import {
  useCsvToExcelConverter,
  type ConvertedFile,
  type UseCsvToExcelConverterReturn,
} from "@/app/tools/csv-to-excel/components/CsvToExcelConverter/hooks";

jest.mock(
  "@/app/tools/csv-to-excel/components/CsvToExcelConverter/hooks",
  () => ({ useCsvToExcelConverter: jest.fn() })
);

const mockUseConverter = useCsvToExcelConverter as jest.Mock;

function makeFile(overrides?: Partial<ConvertedFile>): ConvertedFile {
  return {
    id: "id-1",
    name: "sales.csv",
    rows: [["a", "b"]],
    rowCount: 1,
    columnCount: 2,
    errors: [],
    ...overrides,
  };
}

function makeVm(
  overrides?: Partial<UseCsvToExcelConverterReturn>
): UseCsvToExcelConverterReturn {
  return {
    files: [],
    mode: "merge",
    filename: "",
    isDragging: false,
    isConverting: false,
    rejectionMessage: null,
    canConvert: false,
    showModeChoice: false,
    showFilenameField: false,
    setMode: jest.fn(),
    setFilename: jest.fn(),
    handleFilesPicked: jest.fn(),
    handleFileInputChange: jest.fn(),
    handleDragEnter: jest.fn(),
    handleDragOver: jest.fn(),
    handleDragLeave: jest.fn(),
    handleDrop: jest.fn(),
    removeFile: jest.fn(),
    clearFiles: jest.fn(),
    handleConvert: jest.fn(),
    ...overrides,
  };
}

function renderWithVm(overrides?: Partial<UseCsvToExcelConverterReturn>) {
  mockUseConverter.mockReturnValue(makeVm(overrides));
  return render(<CsvToExcelConverter />);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("CsvToExcelConverter", () => {
  it("shows the dropzone and hides the panel when there are no files", () => {
    renderWithVm({ files: [] });

    expect(screen.getByText("Drag & drop CSV files here")).toBeInTheDocument();
    expect(screen.queryByText(/file(s)? ready/)).not.toBeInTheDocument();
  });

  it("hides the dropzone and shows the panel once files are added", () => {
    renderWithVm({ files: [makeFile()] });

    expect(
      screen.queryByText("Drag & drop CSV files here")
    ).not.toBeInTheDocument();
    expect(screen.getByText("1 file ready")).toBeInTheDocument();
  });

  it("surfaces the rejection message", () => {
    renderWithVm({ rejectionMessage: "Only .csv files are accepted" });

    expect(
      screen.getByText("Only .csv files are accepted")
    ).toBeInTheDocument();
  });

  it("marks the active mode option with data-active", () => {
    renderWithVm({
      files: [makeFile({ id: "a" }), makeFile({ id: "b", name: "orders.csv" })],
      showModeChoice: true,
      mode: "separate",
    });

    expect(screen.getByText("Separate files").closest("label")).toHaveAttribute(
      "data-active"
    );
    expect(
      screen.getByText("One workbook").closest("label")
    ).not.toHaveAttribute("data-active");
  });

  it("renders the filename field only when showFilenameField is set", () => {
    const { rerender } = render(<CsvToExcelConverter />);

    mockUseConverter.mockReturnValue(
      makeVm({ files: [makeFile()], showFilenameField: false })
    );
    rerender(<CsvToExcelConverter />);
    expect(screen.queryByLabelText("File name")).not.toBeInTheDocument();

    mockUseConverter.mockReturnValue(
      makeVm({
        files: [makeFile()],
        showFilenameField: true,
        filename: "sales.xlsx",
      })
    );
    rerender(<CsvToExcelConverter />);
    expect(screen.getByLabelText("File name")).toHaveValue("sales.xlsx");
  });

  it("renders a malformed-line warning for files with errors", () => {
    renderWithVm({
      files: [
        makeFile({
          errors: [
            { line: 2, message: "bad" },
            { line: 5, message: "worse" },
          ],
        }),
      ],
    });

    expect(screen.getByText(/2 malformed lines/)).toBeInTheDocument();
  });

  it("wires the accessible remove-file control", () => {
    renderWithVm({ files: [makeFile({ name: "sales.csv" })] });

    fireEvent.click(screen.getByRole("button", { name: "Remove sales.csv" }));
    expect(mockUseConverter.mock.results[0].value.removeFile).toHaveBeenCalledWith(
      "id-1"
    );
  });

  it("disables the convert button until canConvert is true", () => {
    const { rerender } = render(<CsvToExcelConverter />);

    mockUseConverter.mockReturnValue(
      makeVm({ files: [makeFile()], canConvert: false })
    );
    rerender(<CsvToExcelConverter />);
    expect(screen.getByRole("button", { name: "Download Excel" })).toBeDisabled();

    mockUseConverter.mockReturnValue(
      makeVm({ files: [makeFile()], canConvert: true })
    );
    rerender(<CsvToExcelConverter />);
    expect(
      screen.getByRole("button", { name: "Download Excel" })
    ).toBeEnabled();
  });
});
