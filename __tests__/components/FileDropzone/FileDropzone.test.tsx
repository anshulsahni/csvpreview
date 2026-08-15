import { render, screen, fireEvent } from "@testing-library/react";
import FileDropzone, {
  type FileDropzoneProps,
} from "@/app/components/FileDropzone/FileDropzone";

function makeProps(overrides?: Partial<FileDropzoneProps>): FileDropzoneProps {
  return {
    isDragging: false,
    accept: ".csv",
    label: "Drag & drop CSV files here",
    buttonLabel: "Choose CSV files",
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

  it("opens the hidden file input from the picker button", () => {
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

  it("renders the caller's label, button text and accept filter", () => {
    const { container } = render(
      <FileDropzone
        {...makeProps({
          accept: ".xlsx",
          label: "Drag & drop Excel files here",
          buttonLabel: "Choose Excel files",
        })}
      />
    );

    expect(screen.getByText("Drag & drop Excel files here")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Choose Excel files" })
    ).toBeInTheDocument();
    expect(container.querySelector('input[type="file"]')).toHaveAttribute(
      "accept",
      ".xlsx"
    );
  });

  it("renders the hint only when one is provided", () => {
    const { rerender } = render(<FileDropzone {...makeProps()} />);
    expect(screen.queryByText("Up to 10 files")).not.toBeInTheDocument();

    rerender(<FileDropzone {...makeProps({ hint: "Up to 10 files" })} />);
    expect(screen.getByText("Up to 10 files")).toBeInTheDocument();
  });
});
