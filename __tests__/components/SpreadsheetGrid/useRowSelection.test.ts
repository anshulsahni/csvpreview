import { act, renderHook } from "@testing-library/react";
import { useRowSelection } from "@/app/components/SpreadsheetGrid/useRowSelection";

function makeRows(n: number): string[][] {
  return Array.from({ length: n }, (_, i) => [`r${i}`]);
}

describe("useRowSelection", () => {
  it("toggles a single row on and off", () => {
    const { result } = renderHook(() =>
      useRowSelection({
        bodyRows: makeRows(3),
        sourceRowIndexForDisplayRow: [0, 1, 2],
        visibleRowCount: 3,
      })
    );

    act(() => result.current.toggleRow(1));
    expect(result.current.isBodyIndexSelected(1)).toBe(true);
    expect(result.current.selectAllState).toBe("some");

    act(() => result.current.toggleRow(1));
    expect(result.current.isBodyIndexSelected(1)).toBe(false);
    expect(result.current.selectAllState).toBe("none");
  });

  it("toggle-all selects every visible row, then clears them", () => {
    const { result } = renderHook(() =>
      useRowSelection({
        bodyRows: makeRows(3),
        sourceRowIndexForDisplayRow: [0, 1, 2],
        visibleRowCount: 3,
      })
    );

    act(() => result.current.toggleAllVisible());
    expect(result.current.selectAllState).toBe("all");

    act(() => result.current.toggleAllVisible());
    expect(result.current.selectAllState).toBe("none");
  });

  it("only toggles the currently visible rows on select-all", () => {
    // visibleRowCount 2 => only source indices 0 and 1 participate.
    const { result } = renderHook(() =>
      useRowSelection({
        bodyRows: makeRows(3),
        sourceRowIndexForDisplayRow: [0, 1, 2],
        visibleRowCount: 2,
      })
    );

    act(() => result.current.toggleAllVisible());
    expect(result.current.isBodyIndexSelected(0)).toBe(true);
    expect(result.current.isBodyIndexSelected(1)).toBe(true);
    expect(result.current.isBodyIndexSelected(2)).toBe(false);
  });

  it("emits selected body indices in display order", () => {
    const onRowSelectionChange = jest.fn();
    const { result } = renderHook(() =>
      useRowSelection({
        bodyRows: makeRows(3),
        // display order: display row 0 -> source 2, then 0, then 1.
        sourceRowIndexForDisplayRow: [2, 0, 1],
        visibleRowCount: 3,
        onRowSelectionChange,
      })
    );

    act(() => result.current.toggleRow(0));
    act(() => result.current.toggleRow(2));

    expect(onRowSelectionChange).toHaveBeenLastCalledWith([2, 0]);
  });

  it("clears the selection when the body row count changes", () => {
    const { result, rerender } = renderHook(
      ({ rows }: { rows: string[][] }) =>
        useRowSelection({
          bodyRows: rows,
          sourceRowIndexForDisplayRow: rows.map((_, i) => i),
          visibleRowCount: rows.length,
        }),
      { initialProps: { rows: makeRows(3) } }
    );

    act(() => result.current.toggleRow(0));
    expect(result.current.isBodyIndexSelected(0)).toBe(true);

    // A delete changes the length => selection resets.
    rerender({ rows: makeRows(2) });
    expect(result.current.selectAllState).toBe("none");
    expect(result.current.isBodyIndexSelected(0)).toBe(false);
  });

  it("preserves the selection when the body row count is unchanged", () => {
    const { result, rerender } = renderHook(
      ({ rows }: { rows: string[][] }) =>
        useRowSelection({
          bodyRows: rows,
          sourceRowIndexForDisplayRow: rows.map((_, i) => i),
          visibleRowCount: rows.length,
        }),
      { initialProps: { rows: makeRows(3) } }
    );

    act(() => result.current.toggleRow(1));
    expect(result.current.isBodyIndexSelected(1)).toBe(true);

    // A cell edit keeps the length constant => selection preserved.
    const edited = makeRows(3);
    edited[1] = ["edited"];
    rerender({ rows: edited });
    expect(result.current.isBodyIndexSelected(1)).toBe(true);
  });
});
