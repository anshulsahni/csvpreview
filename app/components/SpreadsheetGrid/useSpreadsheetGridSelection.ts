"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FilterMap } from "@/lib/filterUtils";
import type { SortState } from "@/lib/sortUtils";
import {
  isCellSelected as isCellInSelectionRange,
  selectionStatusHint,
  type CellSelection,
} from "./selectionUtils";

export function useSelectionState({
  numRows,
  numCols,
  isEmpty,
}: {
  numRows: number;
  numCols: number;
  isEmpty: boolean;
}): {
  selection: CellSelection | null;
  isDragging: boolean;
  clearSelection: () => void;
  onCellMouseDown: (rowIdx: number, colIdx: number) => void;
  onCellMouseEnter: (rowIdx: number, colIdx: number) => void;
  onColumnHeaderMouseDown: (colIdx: number) => void;
  onRowGutterMouseDown: (rowIdx: number) => void;
} {
  const [selection, setSelection] = useState<CellSelection | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const clearSelection = useCallback(() => {
    setSelection(null);
    setIsDragging(false);
  }, []);

  const onCellMouseDown = (rowIdx: number, colIdx: number) => {
    if (isEmpty) {
      return;
    }
    setSelection({
      anchorRow: rowIdx,
      anchorCol: colIdx,
      activeRow: rowIdx,
      activeCol: colIdx,
    });
    setIsDragging(true);
  };

  const onCellMouseEnter = (rowIdx: number, colIdx: number) => {
    if (!isDragging) {
      return;
    }
    setSelection((prev) => {
      if (prev === null) {
        return prev;
      }
      return {
        ...prev,
        activeRow: rowIdx,
        activeCol: colIdx,
      };
    });
  };

  const onColumnHeaderMouseDown = (colIdx: number) => {
    if (isEmpty || numRows <= 0) {
      return;
    }
    setSelection({
      anchorRow: 0,
      anchorCol: colIdx,
      activeRow: numRows - 1,
      activeCol: colIdx,
    });
    setIsDragging(false);
  };

  const onRowGutterMouseDown = (rowIdx: number) => {
    if (isEmpty || numCols <= 0) {
      return;
    }
    setSelection({
      anchorRow: rowIdx,
      anchorCol: 0,
      activeRow: rowIdx,
      activeCol: numCols - 1,
    });
    setIsDragging(false);
  };

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const onMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging]);

  return {
    selection,
    isDragging,
    clearSelection,
    onCellMouseDown,
    onCellMouseEnter,
    onColumnHeaderMouseDown,
    onRowGutterMouseDown,
  };
}

export function useSpreadsheetGridSelection({
  numRows,
  numCols,
  isEmpty,
  rowNumberOffset,
  baseStatusHint,
  sort,
  filters,
  firstRowAsHeader,
}: {
  numRows: number;
  numCols: number;
  isEmpty: boolean;
  rowNumberOffset: number;
  baseStatusHint: string;
  sort: SortState | null;
  filters: FilterMap;
  firstRowAsHeader: boolean;
}): {
  selection: CellSelection | null;
  isDragging: boolean;
  statusHint: string;
  onCellMouseDown: (rowIdx: number, colIdx: number) => void;
  onCellMouseEnter: (rowIdx: number, colIdx: number) => void;
  onColumnHeaderMouseDown: (colIdx: number) => void;
  onRowGutterMouseDown: (rowIdx: number) => void;
  isCellSelected: (rowIdx: number, colIdx: number) => boolean;
} {
  const {
    selection,
    isDragging,
    clearSelection,
    onCellMouseDown,
    onCellMouseEnter,
    onColumnHeaderMouseDown,
    onRowGutterMouseDown,
  } = useSelectionState({
    numRows,
    numCols,
    isEmpty,
  });

  const isFirstSelectionCleanupRender = useRef(true);

  useEffect(() => {
    if (isFirstSelectionCleanupRender.current) {
      isFirstSelectionCleanupRender.current = false;
      return;
    }
    clearSelection();
  }, [sort, filters, firstRowAsHeader, clearSelection]);

  const statusHint = useMemo(() => {
    const selectionHint = selectionStatusHint(selection, rowNumberOffset);
    if (selectionHint === null) {
      return baseStatusHint;
    }
    if (baseStatusHint === "\u00a0") {
      return selectionHint;
    }
    return `${baseStatusHint} \u00b7 ${selectionHint}`;
  }, [baseStatusHint, rowNumberOffset, selection]);

  const isCellSelected = useCallback(
    (rowIdx: number, colIdx: number) =>
      isCellInSelectionRange(selection, rowIdx, colIdx),
    [selection]
  );

  return {
    selection,
    isDragging,
    statusHint,
    onCellMouseDown,
    onCellMouseEnter,
    onColumnHeaderMouseDown,
    onRowGutterMouseDown,
    isCellSelected,
  };
}
