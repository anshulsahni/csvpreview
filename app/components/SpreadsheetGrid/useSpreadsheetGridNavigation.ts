"use client";

import { useEffect, useRef, type RefObject } from "react";
import { Keys, useManualKeyboardShortcuts } from "@/app/components/KeyboardShortcuts";
import { ModifierKeys } from "@/app/components/KeyboardShortcuts/keys";
import { clampCell, findDataBlockEdge, lastNonEmptyColInRow } from "./navigationUtils";
import { getActiveCellFromDom, focusCellAt } from "./gridDomUtils";

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
  const ctrlArrow = { mac: ModifierKeys.Meta, windows: ModifierKeys.Ctrl };
  const shiftKey = { mac: ModifierKeys.Shift, windows: ModifierKeys.Shift };

  const move = (deltaRow: number, deltaCol: number) => (event: KeyboardEvent) => {
    const cell = getActiveCellFromDom();
    if (!cell) return;
    event.preventDefault();
    const target = clampCell(cell.rowIdx + deltaRow, cell.colIdx + deltaCol, numRows, numCols);
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

  const arrowUp = useManualKeyboardShortcuts(
    { primaryKey: Keys.ArrowUp },
    move(-1, 0),
  );
  const arrowDown = useManualKeyboardShortcuts(
    { primaryKey: Keys.ArrowDown },
    move(1, 0),
  );
  const arrowLeft = useManualKeyboardShortcuts(
    { primaryKey: Keys.ArrowLeft },
    move(0, -1),
  );
  const arrowRight = useManualKeyboardShortcuts(
    { primaryKey: Keys.ArrowRight },
    move(0, 1),
  );
  const ctrlUp = useManualKeyboardShortcuts(
    { primaryKey: Keys.ArrowUp, modifierKey: ctrlArrow },
    jump(-1, 0),
  );
  const ctrlDown = useManualKeyboardShortcuts(
    { primaryKey: Keys.ArrowDown, modifierKey: ctrlArrow },
    jump(1, 0),
  );
  const ctrlLeft = useManualKeyboardShortcuts(
    { primaryKey: Keys.ArrowLeft, modifierKey: ctrlArrow },
    jump(0, -1),
  );
  const ctrlRight = useManualKeyboardShortcuts(
    { primaryKey: Keys.ArrowRight, modifierKey: ctrlArrow },
    jump(0, 1),
  );
  const homeKey = useManualKeyboardShortcuts({ primaryKey: Keys.Home }, home);
  const endKey = useManualKeyboardShortcuts({ primaryKey: Keys.End }, end);
  const tab = useManualKeyboardShortcuts({ primaryKey: Keys.Tab }, move(0, 1));
  const shiftTab = useManualKeyboardShortcuts(
    { primaryKey: Keys.Tab, modifierKey: shiftKey },
    move(0, -1),
  );

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
        controlsRef.current.forEach((control) => control.attach());
      }
    };

    const onFocusOut = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement && event.target.matches("[data-row][data-col]")) {
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
