import { act, renderHook } from "@testing-library/react";
import type { ChangeEvent } from "react";
import { useToolbar } from "@/app/components/Toolbar/hooks";

describe("useToolbar", () => {
  it("forwards checked state to onFirstRowAsHeaderChange", () => {
    const onFirstRowAsHeaderChange = jest.fn();
    const { result } = renderHook(() =>
      useToolbar({
        firstRowAsHeader: false,
        onFirstRowAsHeaderChange,
      })
    );

    act(() => {
      result.current.handleFirstRowAsHeaderChange({
        target: { checked: true },
      } as ChangeEvent<HTMLInputElement>);
    });

    expect(onFirstRowAsHeaderChange).toHaveBeenCalledWith(true);
  });

  it("forwards unchecked state to onFirstRowAsHeaderChange", () => {
    const onFirstRowAsHeaderChange = jest.fn();
    const { result } = renderHook(() =>
      useToolbar({
        firstRowAsHeader: true,
        onFirstRowAsHeaderChange,
      })
    );

    act(() => {
      result.current.handleFirstRowAsHeaderChange({
        target: { checked: false },
      } as ChangeEvent<HTMLInputElement>);
    });

    expect(onFirstRowAsHeaderChange).toHaveBeenCalledWith(false);
  });
});
