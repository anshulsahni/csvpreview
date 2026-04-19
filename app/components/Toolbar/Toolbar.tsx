"use client";

import { styled } from "@linaria/react";
import { useToolbar } from "./hooks";

export interface ToolbarProps {
  firstRowAsHeader: boolean;
  onFirstRowAsHeaderChange: (value: boolean) => void;
}

export default function Toolbar({
  firstRowAsHeader,
  onFirstRowAsHeaderChange,
}: ToolbarProps) {
  const toolbar = useToolbar({
    firstRowAsHeader,
    onFirstRowAsHeaderChange,
  });

  return (
    <HeaderToggleLabel>
      <HeaderToggleCheckbox
        type="checkbox"
        checked={firstRowAsHeader}
        onChange={toolbar.handleFirstRowAsHeaderChange}
        aria-label="First row as header"
      />
      <span>First row as header</span>
    </HeaderToggleLabel>
  );
}

const HeaderToggleLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.65rem;
  border: 2px solid var(--toolbar-header-toggle-border, #22c55e);
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  color: var(--foreground);
  background: var(--background);

  &:has(input:focus-visible) {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }
`;

const HeaderToggleCheckbox = styled.input`
  width: 1rem;
  height: 1rem;
  accent-color: var(--primary);
  cursor: pointer;
`;
