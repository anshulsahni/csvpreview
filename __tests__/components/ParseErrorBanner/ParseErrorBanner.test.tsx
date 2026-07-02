import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ParseErrorBanner from "@/app/components/ParseErrorBanner";
import type { ParseError } from "@/lib/csvParser";

describe("ParseErrorBanner", () => {
  const errors: ParseError[] = [
    { line: 2, message: "Expected 2 columns but found 3", rowIndex: 1 },
    { line: 4, message: "Trailing quote", rowIndex: 3 },
  ];

  it("renders nothing when there are no errors", () => {
    const { container } = render(
      <ParseErrorBanner errors={[]} onDismiss={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("summarizes the count and lists each error with its line", () => {
    render(<ParseErrorBanner errors={errors} onDismiss={() => {}} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("2 issues found in the loaded CSV")).toBeInTheDocument();
    expect(
      screen.getByText("Line 2: Expected 2 columns but found 3")
    ).toBeInTheDocument();
    expect(screen.getByText("Line 4: Trailing quote")).toBeInTheDocument();
  });

  it("uses the singular noun for a single error", () => {
    render(
      <ParseErrorBanner errors={[errors[0]!]} onDismiss={() => {}} />
    );
    expect(screen.getByText("1 issue found in the loaded CSV")).toBeInTheDocument();
  });

  it("calls onDismiss when the dismiss button is clicked", async () => {
    const user = userEvent.setup();
    const onDismiss = jest.fn();
    render(<ParseErrorBanner errors={errors} onDismiss={onDismiss} />);

    await user.click(
      screen.getByRole("button", { name: "Dismiss error banner" })
    );
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
