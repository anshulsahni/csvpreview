"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";

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
  onCellKeyDown: (event: KeyboardEvent, rowIdx: number, colIdx: number) => void;
  onEditorKeyDown: (
    event: KeyboardEvent<HTMLTextAreaElement>,
    value: string
  ) => void;
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
    }
    setEditingCell(null);
    draftValueRef.current = "";
  };

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
    onCellKeyDown: (event, rowIdx, colIdx) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        startEditing(rowIdx, colIdx);
      }
    },
    onEditorKeyDown: (event, value) => {
      draftValueRef.current = value;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        commitAndStay(value);
        return;
      }
      if (event.key === "Tab") {
        event.preventDefault();
        event.stopPropagation();
        commitAndMove(value, 0, 1);
        return;
      }
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        commitAndMove(value, 1, 0);
      }
    },
  };
}
