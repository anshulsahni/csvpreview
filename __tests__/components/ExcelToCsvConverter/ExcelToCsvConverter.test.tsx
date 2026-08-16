import { render, screen, fireEvent } from "@testing-library/react";
import ExcelToCsvConverter from "@/app/tools/excel-to-csv/components/ExcelToCsvConverter/ExcelToCsvConverter";
import {
  useExcelToCsvConverter,
  LIMITS_HINT,
  type UploadedWorkbook,
  type UseExcelToCsvConverterReturn,
} from "@/app/tools/excel-to-csv/components/ExcelToCsvConverter/hooks";

jest.mock(
  "@/app/tools/excel-to-csv/components/ExcelToCsvConverter/hooks",
  () => {
    const actual = jest.requireActual(
      "@/app/tools/excel-to-csv/components/ExcelToCsvConverter/hooks"
    );
    return { ...actual, useExcelToCsvConverter: jest.fn() };
  }
);

const mockUseConverter = useExcelToCsvConverter as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ExcelToCsvConverter", () => {
  it("hides the dropzone once a workbook is loaded", () => {
    renderWith({ workbooks: [makeWorkbook()], totalSheetCount: 2 });

    expect(
      screen.queryByRole("button", { name: "Choose Excel files" })
    ).not.toBeInTheDocument();
  });

  it("renders one row per worksheet with its editable CSV name", () => {
    renderWith({ workbooks: [makeWorkbook()], totalSheetCount: 2 });

    expect(screen.getByText("2 sheets ready")).toBeInTheDocument();
    expect(screen.getByText("Summary")).toBeInTheDocument();
    expect(screen.getByText("Q1")).toBeInTheDocument();
    expect(screen.getAllByLabelText("CSV file name")).toHaveLength(2);
    expect(screen.getAllByLabelText("CSV file name")[0]).toHaveValue(
      "sales-Summary.csv"
    );
  });

  it("labels the per-sheet actions as real buttons", () => {
    const { vm } = renderWith({
      workbooks: [makeWorkbook()],
      totalSheetCount: 2,
    });

    const download = screen.getByRole("button", {
      name: "Download Summary as CSV",
    });
    expect(download.tagName).toBe("BUTTON");
    fireEvent.click(download);
    expect(vm.downloadOne).toHaveBeenCalledWith("s-1");

    fireEvent.click(screen.getByRole("button", { name: "Copy Q1 as CSV" }));
    expect(vm.copyOne).toHaveBeenCalledWith("s-2");
  });

  it("disables the sheet actions while a sheet is being read", () => {
    renderWith({
      workbooks: [makeWorkbook()],
      totalSheetCount: 2,
      busySheetId: "s-1",
    });

    expect(
      screen.getByRole("button", { name: "Download Summary as CSV" })
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Copy Q1 as CSV" })
    ).toBeDisabled();
    expect(screen.getByText("Working…")).toBeInTheDocument();
  });

  it("shows the rejection message when a file bounces", () => {
    renderWith({
      rejectionMessage: "old.xls is a legacy .xls file.",
    });

    expect(
      screen.getByText("old.xls is a legacy .xls file.")
    ).toBeInTheDocument();
  });

});

function makeWorkbook(overrides?: Partial<UploadedWorkbook>): UploadedWorkbook {
  return {
    id: "wb-1",
    file: new File(["stub"], "sales.xlsx"),
    name: "sales.xlsx",
    sizeBytes: 1024,
    sheets: [
      { id: "s-1", sheetName: "Summary", csvName: "sales-Summary.csv" },
      { id: "s-2", sheetName: "Q1", csvName: "sales-Q1.csv" },
    ],
    ...overrides,
  };
}

function makeVm(
  overrides?: Partial<UseExcelToCsvConverterReturn>
): UseExcelToCsvConverterReturn {
  return {
    workbooks: [],
    isDragging: false,
    busySheetId: null,
    isZipping: false,
    rejectionMessage: null,
    totalSheetCount: 0,
    canDownloadAll: false,
    handleFilesPicked: jest.fn(),
    handleFileInputChange: jest.fn(),
    handleDragEnter: jest.fn(),
    handleDragOver: jest.fn(),
    handleDragLeave: jest.fn(),
    handleDrop: jest.fn(),
    renameCsv: jest.fn(),
    removeWorkbook: jest.fn(),
    clearAll: jest.fn(),
    downloadOne: jest.fn(),
    copyOne: jest.fn(),
    downloadAll: jest.fn(),
    ...overrides,
  };
}

function renderWith(overrides?: Partial<UseExcelToCsvConverterReturn>) {
  const vm = makeVm(overrides);
  mockUseConverter.mockReturnValue(vm);
  return { vm, ...render(<ExcelToCsvConverter />) };
}
