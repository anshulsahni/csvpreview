"use client";

import { useEffect, useRef, useState } from "react";
import { Keys, useKeyboardShortcuts } from "@/app/components/KeyboardShortcuts";

export interface EditingCell {
  rowIdx: number;
  colIdx: number;
}

interface UseSpreadsheetGridEditingArgs {
  bodyRows: readonly string[][];
  numRows: number;
  numCols: number;
  sourceBodyIndexForDisplayRow: (displayRow: number) => number;
  bodyRowIndexToDataRowIndex: (bodyRowIndex: number) => number;
  onCellChange?: (dataRowIndex: number, colIdx: number, value: string) => void;
  selectSingleCell: (rowIdx: number, colIdx: number) => void;
}

export interface SpreadsheetGridEditingVm {
  focusedCell: EditingCell | null;
  editingCell: EditingCell | null;
  isEditingCell: (rowIdx: number, colIdx: number) => boolean;
  onDraftValueChange: (value: string) => void;
  onCellFocus: (rowIdx: number, colIdx: number) => void;
  onCellMouseDown: (rowIdx: number, colIdx: number) => void;
  onCellDoubleClick: (rowIdx: number, colIdx: number) => void;
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function useSpreadsheetGridEditing({
  bodyRows,
  numRows,
  numCols,
  sourceBodyIndexForDisplayRow,
  bodyRowIndexToDataRowIndex,
  onCellChange,
  selectSingleCell,
}: UseSpreadsheetGridEditingArgs): SpreadsheetGridEditingVm {
  const [focusedCell, setFocusedCell] = useState<EditingCell | null>(null);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const draftValueRef = useRef("");
  const pendingFocusCellRef = useRef<EditingCell | null>(null);

  const isEditingCell = (rowIdx: number, colIdx: number) =>
    editingCell?.rowIdx === rowIdx && editingCell.colIdx === colIdx;

  const commitAt = (
    rowIdx: number,
    colIdx: number,
    value: string
  ) => {
    const sourceBodyIndex = sourceBodyIndexForDisplayRow(rowIdx);
    const dataRowIndex = bodyRowIndexToDataRowIndex(sourceBodyIndex);
    onCellChange?.(dataRowIndex, colIdx, value);
  };

  const startEditing = (rowIdx: number, colIdx: number) => {
    setFocusedCell({ rowIdx, colIdx });
    selectSingleCell(rowIdx, colIdx);
    setEditingCell({ rowIdx, colIdx });
    draftValueRef.current = bodyRows[rowIdx]?.[colIdx] ?? "";
  };

  const exitEditing = (
    nextFocus?: EditingCell
  ) => {
    const target = nextFocus ?? editingCell;
    if (target) {
      const clamped = {
        rowIdx: clamp(target.rowIdx, 0, Math.max(0, numRows - 1)),
        colIdx: clamp(target.colIdx, 0, Math.max(0, numCols - 1)),
      };
      setFocusedCell(clamped);
      selectSingleCell(clamped.rowIdx, clamped.colIdx);
      pendingFocusCellRef.current = clamped;
    }
    setEditingCell(null);
    draftValueRef.current = "";
  };

  useEffect(() => {
    if (editingCell !== null) return;
    const pending = pendingFocusCellRef.current;
    if (pending === null) return;
    pendingFocusCellRef.current = null;
    const el = document.querySelector<HTMLElement>(
      `[data-row="${pending.rowIdx}"][data-col="${pending.colIdx}"]`
    );
    el?.focus();
  }, [editingCell]);

  const commitAndMove = (value: string, deltaRow: number, deltaCol: number) => {
    if (editingCell === null) return;
    commitAt(editingCell.rowIdx, editingCell.colIdx, value);
    exitEditing({
      rowIdx: editingCell.rowIdx + deltaRow,
      colIdx: editingCell.colIdx + deltaCol,
    });
  };

  const commitAndStay = (value: string) => {
    if (editingCell === null) return;
    commitAt(editingCell.rowIdx, editingCell.colIdx, value);
    exitEditing(editingCell);
  };

  const commitAndFocusCell = (rowIdx: number, colIdx: number) => {
    if (
      editingCell !== null &&
      (editingCell.rowIdx !== rowIdx || editingCell.colIdx !== colIdx)
    ) {
      commitAt(editingCell.rowIdx, editingCell.colIdx, draftValueRef.current);
      setEditingCell(null);
      draftValueRef.current = "";
    }
    setFocusedCell({ rowIdx, colIdx });
  };

  const activeFocusedCell = (): EditingCell | null => {
    const activeElement = document.activeElement;
    if (!(activeElement instanceof HTMLElement)) return null;
    if (!activeElement.matches("[data-row][data-col]")) return null;

    const rowIdx = Number(activeElement.dataset.row);
    const colIdx = Number(activeElement.dataset.col);
    if (!Number.isInteger(rowIdx) || !Number.isInteger(colIdx)) return null;
    return { rowIdx, colIdx };
  };

  const isEditorActive = () => {
    if (editingCell === null) return false;
    const activeElement = document.activeElement;
    if (!(activeElement instanceof HTMLTextAreaElement)) return false;

    const editingCellElement = activeElement.closest<HTMLElement>(
      "[data-row][data-col]"
    );
    return (
      editingCellElement?.dataset.row === String(editingCell.rowIdx) &&
      editingCellElement.dataset.col === String(editingCell.colIdx)
    );
  };

  useKeyboardShortcuts(
    { primaryKey: Keys.Enter },
    (event) => {
      if (event.isComposing) return;
      if (isEditorActive()) {
        event.preventDefault();
        event.stopPropagation();
        commitAndMove(draftValueRef.current, 1, 0);
        return;
      }

      if (editingCell !== null) return;
      const cell = activeFocusedCell();
      if (cell === null) return;
      event.preventDefault();
      startEditing(cell.rowIdx, cell.colIdx);
    },
    [editingCell],
    { allowInEditable: true }
  );

  useKeyboardShortcuts(
    { primaryKey: Keys.Tab },
    (event) => {
      if (event.isComposing || !isEditorActive()) return;
      event.preventDefault();
      event.stopPropagation();
      commitAndStay(draftValueRef.current);
    },
    [editingCell],
    { allowInEditable: true }
  );

  useKeyboardShortcuts(
    { primaryKey: Keys.Tab },
    (event) => {
      if (event.isComposing || !isEditorActive()) return;
      event.preventDefault();
      event.stopPropagation();
      commitAndMove(draftValueRef.current, 0, 1);
    },
    [editingCell],
    { allowInEditable: true }
  );

  return {
    focusedCell,
    editingCell,
    isEditingCell,
    onDraftValueChange: (value) => {
      draftValueRef.current = value;
    },
    onCellFocus: (rowIdx, colIdx) => {
      setFocusedCell({ rowIdx, colIdx });
    },
    onCellMouseDown: (rowIdx, colIdx) => {
      commitAndFocusCell(rowIdx, colIdx);
    },
    onCellDoubleClick: (rowIdx, colIdx) => {
      startEditing(rowIdx, colIdx);
    },
  };
}
