"use client";

import { styled } from "@linaria/react";
import type { SortDirection } from "@/lib/sortUtils";

export interface SortButtonProps {
  activeDirection: SortDirection | null;
  columnLabel: string;
  onClick: () => void;
}

const GLYPH: Record<"asc" | "desc" | "none", string> = {
  asc: "▲",
  desc: "▼",
  none: "▼▲",
};

export function SortButton({
  activeDirection,
  columnLabel,
  onClick,
}: SortButtonProps) {
  return (
    <SortBtn
      type="button"
      aria-label={
        activeDirection
          ? `Sort column ${columnLabel}, ${activeDirection === "asc" ? "ascending" : "descending"}`
          : `Sort column ${columnLabel}`
      }
      data-active={activeDirection ? "true" : undefined}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {GLYPH[activeDirection ?? "none"]}
    </SortBtn>
  );
}

const SortBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  padding: 2px 4px;
  margin: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
  color: var(--grid-sort-arrow-idle);

  &[data-active="true"] {
    color: var(--grid-sort-arrow-active);
  }

  &:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 1px;
  }
`;
