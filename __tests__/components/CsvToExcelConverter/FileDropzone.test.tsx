import { render, screen, fireEvent } from "@testing-library/react";
import FileDropzone, {
  type FileDropzoneProps,
} from "@/app/tools/csv-to-excel/components/CsvToExcelConverter/FileDropzone";

function makeProps(
  overrides?: Partial<FileDropzoneProps>
): FileDropzoneProps {
  return {
    isDragging: false,
    onFileInputChange: jest.fn(),
    onDragEnter: jest.fn(),
    onDragOver: jest.fn(),
    onDragLeave: jest.fn(),
    onDrop: jest.fn(),
    ...overrides,
  };
}

describe("FileDropzone", () => {
  it("omits data-dragging when not dragging", () => {
    const { container } = render(<FileDropzone {...makeProps()} />);
    expect(container.firstChild).not.toHaveAttribute("data-dragging");
  });

  it("sets data-dragging while dragging", () => {
    const { container } = render(
      <FileDropzone {...makeProps({ isDragging: true })} />
    );
    expect(container.firstChild).toHaveAttribute("data-dragging");
  });

  it("opens the hidden file input from the Choose CSV files button", () => {
    const { container } = render(<FileDropzone {...makeProps()} />);
    const input = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const clickSpy = jest.spyOn(input, "click");

    fireEvent.click(screen.getByRole("button", { name: "Choose CSV files" }));

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("forwards picked files through onFileInputChange", () => {
    const onFileInputChange = jest.fn();
    const { container } = render(
      <FileDropzone {...makeProps({ onFileInputChange })} />
    );
    const input = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    fireEvent.change(input, {
      target: { files: [new File(["a,b"], "data.csv", { type: "text/csv" })] },
    });

    expect(onFileInputChange).toHaveBeenCalledTimes(1);
    expect(input).toHaveAttribute("accept", ".csv");
    expect(input).toHaveAttribute("multiple");
  });

  it("fires drag handlers on drag events", () => {
    const onDragEnter = jest.fn();
    const onDrop = jest.fn();
    const { container } = render(
      <FileDropzone {...makeProps({ onDragEnter, onDrop })} />
    );

    fireEvent.dragEnter(container.firstChild as Element);
    fireEvent.drop(container.firstChild as Element);

    expect(onDragEnter).toHaveBeenCalledTimes(1);
    expect(onDrop).toHaveBeenCalledTimes(1);
  });
});
