"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

export function useActiveCellIndicator(
  scrollerRef: RefObject<HTMLDivElement | null>,
  overlayRef: RefObject<HTMLDivElement | null>,
  focusedCell: { rowIdx: number; colIdx: number } | null,
  editingCell: { rowIdx: number; colIdx: number } | null,
  layoutDeps: readonly unknown[]
): void {
  const wasVisibleRef = useRef(false);
  const applyRef = useRef<() => void>(() => {});

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const apply = () => {
      const overlayEl = overlayRef.current;
      if (!overlayEl) return;

      if (!focusedCell || editingCell) {
        wasVisibleRef.current = false;
        overlayEl.style.opacity = "0";
        return;
      }

      const scroller = scrollerRef.current;
      const td = document.querySelector<HTMLElement>(
        `[data-row="${focusedCell.rowIdx}"][data-col="${focusedCell.colIdx}"]`
      );
      if (!scroller || !td) return;

      const tdRect = td.getBoundingClientRect();
      const scrollerRect = scroller.getBoundingClientRect();
      const left = tdRect.left - scrollerRect.left + scroller.scrollLeft;
      const top = tdRect.top - scrollerRect.top + scroller.scrollTop;

      const shouldAnimate = wasVisibleRef.current;
      wasVisibleRef.current = true;

      overlayEl.style.width = `${td.offsetWidth}px`;
      overlayEl.style.height = `${td.offsetHeight}px`;

      if (!shouldAnimate) {
        // First appearance: jump to position instantly, then enable transition for future moves.
        overlayEl.style.transition = "none";
        overlayEl.style.transform = `translate(${left}px, ${top}px)`;
        overlayEl.getBoundingClientRect(); // force reflow before re-enabling transition
        overlayEl.style.transition = "";
        overlayEl.style.opacity = "1";
      } else {
        overlayEl.style.transform = `translate(${left}px, ${top}px)`;
        overlayEl.style.opacity = "1";
      }
    };

    applyRef.current = apply;
    apply();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedCell, editingCell, scrollerRef, overlayRef, ...layoutDeps]);

  useEffect(() => {
    const handler = () => applyRef.current();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
}
