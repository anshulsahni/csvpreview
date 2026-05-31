"use client";

import { useRef, type RefObject } from "react";
import { styled } from "@linaria/react";
import { useActiveCellIndicator } from "./useActiveCellIndicator";

interface FocusOverlayProps {
  scrollerRef: RefObject<HTMLDivElement | null>;
  focusedCell: { rowIdx: number; colIdx: number } | null;
  editingCell: { rowIdx: number; colIdx: number } | null;
  layoutDeps: readonly unknown[];
}

export default function FocusOverlay({
  scrollerRef,
  focusedCell,
  editingCell,
  layoutDeps,
}: FocusOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
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
