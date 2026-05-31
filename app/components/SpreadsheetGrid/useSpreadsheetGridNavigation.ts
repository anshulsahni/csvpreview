"use client";

import { useEffect, useRef, type RefObject } from "react";
import { Keys, useManualKeyboardShortcuts } from "@/app/components/KeyboardShortcuts";
import { ModifierKeys } from "@/app/components/KeyboardShortcuts/keys";
import type { ShortcutDefinition } from "@/app/components/KeyboardShortcuts/types";
import { clampCell, findDataBlockEdge, lastNonEmptyColInRow } from "./navigationUtils";
import { getActiveCellFromDom, focusCellAt } from "./gridDomUtils";

// Stable module-level shortcut definitions so register/unregister signatures are consistent.
const S_UP: ShortcutDefinition = { primaryKey: Keys.ArrowUp };
const S_DOWN: ShortcutDefinition = { primaryKey: Keys.ArrowDown };
const S_LEFT: ShortcutDefinition = { primaryKey: Keys.ArrowLeft };
const S_RIGHT: ShortcutDefinition = { primaryKey: Keys.ArrowRight };
const S_CTRL_UP: ShortcutDefinition = {
  primaryKey: Keys.ArrowUp,
  modifierKey: { mac: ModifierKeys.Meta, windows: ModifierKeys.Ctrl },
};
const S_CTRL_DOWN: ShortcutDefinition = {
  primaryKey: Keys.ArrowDown,
  modifierKey: { mac: ModifierKeys.Meta, windows: ModifierKeys.Ctrl },
};
const S_CTRL_LEFT: ShortcutDefinition = {
  primaryKey: Keys.ArrowLeft,
  modifierKey: { mac: ModifierKeys.Meta, windows: ModifierKeys.Ctrl },
};
const S_CTRL_RIGHT: ShortcutDefinition = {
  primaryKey: Keys.ArrowRight,
  modifierKey: { mac: ModifierKeys.Meta, windows: ModifierKeys.Ctrl },
};
const S_HOME: ShortcutDefinition = { primaryKey: Keys.Home };
const S_END: ShortcutDefinition = { primaryKey: Keys.End };
const S_TAB: ShortcutDefinition = { primaryKey: Keys.Tab };
const S_SHIFT_TAB: ShortcutDefinition = {
  primaryKey: Keys.Tab,
  modifierKey: { mac: ModifierKeys.Shift, windows: ModifierKeys.Shift },
};

interface UseSpreadsheetGridNavigationArgs {
  gridRef: RefObject<HTMLElement | null>;
  numRows: number;
  numCols: number;
  bodyRows: readonly string[][];
}

export function useSpreadsheetGridNavigation({
  gridRef,
  numRows,
  numCols,
  bodyRows,
}: UseSpreadsheetGridNavigationArgs): void {
  const move = (deltaRow: number, deltaCol: number) => (event: KeyboardEvent) => {
    const cell = getActiveCellFromDom();
    if (!cell) return;
    event.preventDefault();
    const target = clampCell(cell.rowIdx + deltaRow, cell.colIdx + deltaCol, numRows, numCols);
    focusCellAt(target.rowIdx, target.colIdx);
  };

  const jump = (dr: number, dc: number) => (event: KeyboardEvent) => {
    const cell = getActiveCellFromDom();
    if (!cell) return;
    event.preventDefault();
    const target = findDataBlockEdge(bodyRows, cell.rowIdx, cell.colIdx, dr, dc, numRows, numCols);
    focusCellAt(target.rowIdx, target.colIdx);
  };

  const home = (event: KeyboardEvent) => {
    const cell = getActiveCellFromDom();
    if (!cell) return;
    event.preventDefault();
    focusCellAt(cell.rowIdx, 0);
  };

  const end = (event: KeyboardEvent) => {
    const cell = getActiveCellFromDom();
    if (!cell) return;
    event.preventDefault();
    const colIdx = lastNonEmptyColInRow(bodyRows, cell.rowIdx, numCols);
    focusCellAt(cell.rowIdx, colIdx);
  };

  const arrowUp    = useManualKeyboardShortcuts(S_UP,         move(-1, 0));
  const arrowDown  = useManualKeyboardShortcuts(S_DOWN,       move(1, 0));
  const arrowLeft  = useManualKeyboardShortcuts(S_LEFT,       move(0, -1));
  const arrowRight = useManualKeyboardShortcuts(S_RIGHT,      move(0, 1));
  const ctrlUp     = useManualKeyboardShortcuts(S_CTRL_UP,    jump(-1, 0));
  const ctrlDown   = useManualKeyboardShortcuts(S_CTRL_DOWN,  jump(1, 0));
  const ctrlLeft   = useManualKeyboardShortcuts(S_CTRL_LEFT,  jump(0, -1));
  const ctrlRight  = useManualKeyboardShortcuts(S_CTRL_RIGHT, jump(0, 1));
  const homeKey    = useManualKeyboardShortcuts(S_HOME,       home);
  const endKey     = useManualKeyboardShortcuts(S_END,        end);
  const tab        = useManualKeyboardShortcuts(S_TAB,        move(0, 1));
  const shiftTab   = useManualKeyboardShortcuts(S_SHIFT_TAB,  move(0, -1));

  const allControls = [
    arrowUp, arrowDown, arrowLeft, arrowRight,
    ctrlUp, ctrlDown, ctrlLeft, ctrlRight,
    homeKey, endKey, tab, shiftTab,
  ];

  const controlsRef = useRef(allControls);
  useEffect(() => {
    controlsRef.current = allControls;
  });

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;

    const onFocusIn = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement && event.target.matches("[data-row][data-col]")) {
        controlsRef.current.forEach((c) => c.attach());
      }
    };

    const onFocusOut = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement && event.target.matches("[data-row][data-col]")) {
        controlsRef.current.forEach((c) => c.detach());
      }
    };

    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", onFocusOut);
    return () => {
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", onFocusOut);
      controlsRef.current.forEach((c) => c.detach());
    };
  }, [gridRef]);
}
