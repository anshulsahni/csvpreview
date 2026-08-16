"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  computeSelectAllState,
  orderedSelectedBodyIndices,
  sameIndices,
  toggleInSet,
  type SelectAllState,
} from "./rowSelectionUtils";

export interface UseRowSelectionArgs {
  /** Body rows in display order (post sort/filter). Only its length is used. */
  bodyRows: string[][];
  /** display row → source body index map for the currently visible rows. */
  sourceRowIndexForDisplayRow: number[];
  /** Number of real (non-padding) display rows. */
  visibleRowCount: number;
  /** Notified with the selected source body indices in display order. */
  onRowSelectionChange?: (selectedBodyIndices: number[]) => void;
}

export interface UseRowSelectionReturn {
  selectedRowIds: Set<number>;
  selectAllState: SelectAllState;
  isBodyIndexSelected: (bodyIndex: number) => boolean;
  toggleRow: (bodyIndex: number) => void;
  toggleAllVisible: () => void;
  clear: () => void;
}

/**
 * Owns per-row selection for the grid, keyed by stable source body index.
 *
 * The set survives sort/filter changes (identity is source-based), but is
 * cleared whenever the number of body rows changes — a cell edit keeps the
 * length constant (selection preserved) while a row delete changes it
 * (selection reset), so the set can never point at shifted indices.
 */
export function useRowSelection({
  bodyRows,
  sourceRowIndexForDisplayRow,
  visibleRowCount,
  onRowSelectionChange,
}: UseRowSelectionArgs): UseRowSelectionReturn {
  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(
    () => new Set()
  );

  const bodyRowCount = bodyRows.length;
  const prevBodyRowCount = useRef<number>(bodyRowCount);
  useEffect(() => {
    if (prevBodyRowCount.current !== bodyRowCount) {
      prevBodyRowCount.current = bodyRowCount;
      setSelectedRowIds((prev) => (prev.size === 0 ? prev : new Set()));
    }
  }, [bodyRowCount]);

  // Only the currently visible display rows can participate in select-all.
  const visibleBodyIndices = useMemo(
    () => sourceRowIndexForDisplayRow.slice(0, visibleRowCount),
    [sourceRowIndexForDisplayRow, visibleRowCount]
  );

  const selectAllState = useMemo(
    () => computeSelectAllState(selectedRowIds, visibleBodyIndices),
    [selectedRowIds, visibleBodyIndices]
  );

  const toggleRow = useCallback((bodyIndex: number) => {
    setSelectedRowIds((prev) => toggleInSet(prev, bodyIndex));
  }, []);

  const toggleAllVisible = useCallback(() => {
    setSelectedRowIds((prev) => {
      const everyVisibleSelected =
        visibleBodyIndices.length > 0 &&
        visibleBodyIndices.every((idx) => prev.has(idx));
      const next = new Set(prev);
      if (everyVisibleSelected) {
        for (const idx of visibleBodyIndices) next.delete(idx);
      } else {
        for (const idx of visibleBodyIndices) next.add(idx);
      }
      return next;
    });
  }, [visibleBodyIndices]);

  const clear = useCallback(() => {
    setSelectedRowIds((prev) => (prev.size === 0 ? prev : new Set()));
  }, []);

  const isBodyIndexSelected = useCallback(
    (bodyIndex: number) => selectedRowIds.has(bodyIndex),
    [selectedRowIds]
  );

  // Notify only when the emitted selection actually changed. The consumer
  // typically stores this array in state, so re-emitting an equal-but-new array
  // (which happens whenever `sourceRowIndexForDisplayRow` is recomputed) would
  // trigger a render, recompute the array again, and loop forever.
  const lastNotifiedRef = useRef<number[] | null>(null);
  useEffect(() => {
    const next = orderedSelectedBodyIndices(
      sourceRowIndexForDisplayRow,
      selectedRowIds
    );
    const previous = lastNotifiedRef.current;
    if (previous !== null && sameIndices(previous, next)) return;
    lastNotifiedRef.current = next;
    onRowSelectionChange?.(next);
  }, [selectedRowIds, sourceRowIndexForDisplayRow, onRowSelectionChange]);

  return {
    selectedRowIds,
    selectAllState,
    isBodyIndexSelected,
    toggleRow,
    toggleAllVisible,
    clear,
  };
}
