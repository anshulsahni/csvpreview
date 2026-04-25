import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FilterDropdown from "@/app/components/FilterDropdown";

describe("FilterDropdown", () => {
  it("renders text mode with searchable checkbox list", () => {
    render(
      <FilterDropdown
        title="City"
        columnType="text"
        uniqueValues={["Mumbai", "Delhi", "Pune", "Chennai", "Bengaluru"]}
        currentFilter={null}
        onApply={jest.fn()}
        onClear={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByRole("dialog", { name: "Filter City" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Search filter values" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Mumbai" })).toBeInTheDocument();
  });

  it("renders numeric mode and applies operator + value", async () => {
    const user = userEvent.setup();
    const onApply = jest.fn();
    render(
      <FilterDropdown
        title="Age"
        columnType="numeric"
        uniqueValues={[]}
        currentFilter={null}
        onApply={onApply}
        onClear={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await user.selectOptions(screen.getByRole("combobox", { name: "Numeric operator" }), ">=");
    await user.type(screen.getByRole("spinbutton", { name: "Numeric filter value" }), "25");
    await user.click(screen.getByRole("button", { name: "Apply Filter" }));

    expect(onApply).toHaveBeenCalledWith({
      kind: "numeric",
      op: ">=",
      value: 25,
    });
  });

  it("clear button forwards clear callback", async () => {
    const user = userEvent.setup();
    const onClear = jest.fn();
    render(
      <FilterDropdown
        title="City"
        columnType="text"
        uniqueValues={["Delhi"]}
        currentFilter={null}
        onApply={jest.fn()}
        onClear={onClear}
        onClose={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(onClear).toHaveBeenCalled();
  });
});
