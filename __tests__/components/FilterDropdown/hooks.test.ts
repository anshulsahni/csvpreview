import { renderHook, act } from "@testing-library/react";
import { useFilterDropdown } from "@/app/components/FilterDropdown/hooks";

describe("useFilterDropdown", () => {
  it("text mode initializes with all values selected and applies null when unchanged", () => {
    const onApply = jest.fn();
    const onClear = jest.fn();
    const { result } = renderHook(() =>
      useFilterDropdown({
        columnType: "text",
        uniqueValues: ["Delhi", "Pune"],
        currentFilter: null,
        onApply,
        onClear,
      })
    );

    expect(result.current.selectedValues).toEqual(new Set(["Delhi", "Pune"]));

    act(() => {
      result.current.apply();
    });
    expect(onApply).toHaveBeenCalledWith(null);
  });

  it("text mode search filters visible values", () => {
    const { result } = renderHook(() =>
      useFilterDropdown({
        columnType: "text",
        uniqueValues: ["Mumbai", "Delhi", "Pune", "Chennai", "Bengaluru"],
        currentFilter: null,
        onApply: jest.fn(),
        onClear: jest.fn(),
      })
    );

    expect(result.current.showSearch).toBe(true);
    act(() => {
      result.current.setSearchQuery("del");
    });
    expect(result.current.visibleValues).toEqual(["Delhi"]);
  });

  it("numeric mode disables apply until value is valid", () => {
    const onApply = jest.fn();
    const { result } = renderHook(() =>
      useFilterDropdown({
        columnType: "numeric",
        uniqueValues: [],
        currentFilter: null,
        onApply,
        onClear: jest.fn(),
      })
    );

    expect(result.current.isApplyDisabled).toBe(true);
    act(() => {
      result.current.setNumericOperator(">=");
    });
    act(() => {
      result.current.setNumericValue("20");
    });
    act(() => {
      result.current.apply();
    });

    expect(onApply).toHaveBeenCalledWith({
      kind: "numeric",
      op: ">=",
      value: 20,
    });
  });
});
