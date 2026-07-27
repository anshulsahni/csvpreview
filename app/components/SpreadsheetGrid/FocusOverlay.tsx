"use client";

import { useRef, useSyncExternalStore, type RefObject } from "react";
import { styled } from "@linaria/react";
import { useActiveCellIndicator } from "./useActiveCellIndicator";
import type { FocusCellStore } from "./focusCellStore";

interface FocusOverlayProps {
  scrollerRef: RefObject<HTMLDivElement | null>;
  focusStore: FocusCellStore;
  editingCell: { rowIdx: number; colIdx: number } | null;
  layoutDeps: readonly unknown[];
}

export default function FocusOverlay({
  scrollerRef,
  focusStore,
  editingCell,
  layoutDeps,
}: FocusOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  // Subscribe to the focused cell here so only this one-<div> overlay re-renders
  // on focus moves — the grid body stays untouched.
  const focusedCell = useSyncExternalStore(
    focusStore.subscribe,
    focusStore.get,
    focusStore.getServerSnapshot
  );
  useActiveCellIndicator(scrollerRef, overlayRef, focusedCell, editingCell, layoutDeps);

  return <Overlay ref={overlayRef} aria-hidden="true" />;
}

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  box-sizing: border-box;
  border: 2px solid var(--primary);
  will-change: transform;
  opacity: 0;
  transition: transform 120ms ease, opacity 120ms ease;
`;
