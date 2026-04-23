"use client";

import { styled } from "@linaria/react";
import type { SortDirection } from "@/lib/sortUtils";

export interface SortArrowsProps {
  activeDirection: SortDirection | null;
  columnLabel: string;
  onArrowClick: (direction: SortDirection) => void;
}

export function SortArrows({
  activeDirection,
  columnLabel,
  onArrowClick,
}: SortArrowsProps) {
  return (
    <SortArrowsWrap>
      <SortArrowBtn
        type="button"
        aria-label={`Sort column ${columnLabel} ascending`}
        data-active={activeDirection === "asc" ? "true" : undefined}
        onClick={(e) => {
          e.stopPropagation();
          onArrowClick("asc");
        }}
      >
        ▲
      </SortArrowBtn>
      <SortArrowBtn
        type="button"
        aria-label={`Sort column ${columnLabel} descending`}
        data-active={activeDirection === "desc" ? "true" : undefined}
        onClick={(e) => {
          e.stopPropagation();
          onArrowClick("desc");
        }}
      >
        ▼
      </SortArrowBtn>
    </SortArrowsWrap>
  );
}

const SortArrowsWrap = styled.span`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  line-height: 1;
`;

const SortArrowBtn = styled.button`
  display: block;
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 9px;
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
