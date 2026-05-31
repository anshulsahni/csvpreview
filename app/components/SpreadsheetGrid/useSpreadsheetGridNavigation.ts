"use client";

import { useEffect, useRef, type RefObject } from "react";
import {
  Keys,
  useManualKeyboardShortcuts,
} from "@/app/components/KeyboardShortcuts";
import { ModifierKeys } from "@/app/components/KeyboardShortcuts/keys";
import {
  clampCell,
  findDataBlockEdge,
  lastNonEmptyColInRow,
} from "./navigationUtils";
import { getActiveCellFromDom, focusCellAt } from "./gridDomUtils";

interface UseSpreadsheetGridNavigationArgs {
  gridRef: RefObject<HTMLElement | null>;
  numRows: number;
  numCols: number;
  bodyRows: readonly string[][];
}

// `useManualKeyboardShortcuts` requires stable (module-level) shortcut
// definitions — re-creating these objects on every render would re-run the
// hook's cleanup effect and unregister the shortcut while a cell is focused.
const ctrlArrow = { mac: ModifierKeys.Meta, windows: ModifierKeys.Ctrl };
const shiftKey = { mac: ModifierKeys.Shift, windows: ModifierKeys.Shift };

const ARROW_UP = { primaryKey: Keys.ArrowUp };
const ARROW_DOWN = { primaryKey: Keys.ArrowDown };
const ARROW_LEFT = { primaryKey: Keys.ArrowLeft };
const ARROW_RIGHT = { primaryKey: Keys.ArrowRight };
const CTRL_UP = { primaryKey: Keys.ArrowUp, modifierKey: ctrlArrow };
const CTRL_DOWN = { primaryKey: Keys.ArrowDown, modifierKey: ctrlArrow };
const CTRL_LEFT = { primaryKey: Keys.ArrowLeft, modifierKey: ctrlArrow };
const CTRL_RIGHT = { primaryKey: Keys.ArrowRight, modifierKey: ctrlArrow };
const HOME = { primaryKey: Keys.Home };
const END = { primaryKey: Keys.End };
const TAB = { primaryKey: Keys.Tab };
const SHIFT_TAB = { primaryKey: Keys.Tab, modifierKey: shiftKey };

export function useSpreadsheetGridNavigation({
  gridRef,
  numRows,
  numCols,
  bodyRows,
}: UseSpreadsheetGridNavigationArgs): void {
  const move =
    (deltaRow: number, deltaCol: number) => (event: KeyboardEvent) => {
      const cell = getActiveCellFromDom();
      if (!cell) return;
      event.preventDefault();
      const target = clampCell(
        cell.rowIdx + deltaRow,
        cell.colIdx + deltaCol,
        numRows,
        numCols,
      );
      focusCellAt(target.rowIdx, target.colIdx);
    };

  const jump =
    (rowDelta: number, colDelta: number) => (event: KeyboardEvent) => {
      const cell = getActiveCellFromDom();
      if (!cell) return;
      event.preventDefault();
      const target = findDataBlockEdge(
        bodyRows,
        cell.rowIdx,
        cell.colIdx,
        rowDelta,
        colDelta,
        numRows,
        numCols,
      );
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
    focusCellAt(
      cell.rowIdx,
      lastNonEmptyColInRow(bodyRows, cell.rowIdx, numCols),
    );
  };

  const arrowUp = useManualKeyboardShortcuts(ARROW_UP, move(-1, 0));
  const arrowDown = useManualKeyboardShortcuts(ARROW_DOWN, move(1, 0));
  const arrowLeft = useManualKeyboardShortcuts(ARROW_LEFT, move(0, -1));
  const arrowRight = useManualKeyboardShortcuts(ARROW_RIGHT, move(0, 1));
  const ctrlUp = useManualKeyboardShortcuts(CTRL_UP, jump(-1, 0));
  const ctrlDown = useManualKeyboardShortcuts(CTRL_DOWN, jump(1, 0));
  const ctrlLeft = useManualKeyboardShortcuts(CTRL_LEFT, jump(0, -1));
  const ctrlRight = useManualKeyboardShortcuts(CTRL_RIGHT, jump(0, 1));
  const homeKey = useManualKeyboardShortcuts(HOME, home);
  const endKey = useManualKeyboardShortcuts(END, end);
  const tab = useManualKeyboardShortcuts(TAB, move(0, 1));
  const shiftTab = useManualKeyboardShortcuts(SHIFT_TAB, move(0, -1));

  const allControls = [
    arrowUp,
    arrowDown,
    arrowLeft,
    arrowRight,
    ctrlUp,
    ctrlDown,
    ctrlLeft,
    ctrlRight,
    homeKey,
    endKey,
    tab,
    shiftTab,
  ];

  const controlsRef = useRef(allControls);
  useEffect(() => {
    controlsRef.current = allControls;
  });

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;

    const onFocusIn = (event: FocusEvent) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.matches("[data-row][data-col]")
      ) {
        controlsRef.current.forEach((control) => control.attach());
      }
    };

    const onFocusOut = (event: FocusEvent) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.matches("[data-row][data-col]")
      ) {
        controlsRef.current.forEach((control) => control.detach());
      }
    };

    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", onFocusOut);
    return () => {
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", onFocusOut);
      controlsRef.current.forEach((control) => control.detach());
    };
  }, [gridRef]);
}
