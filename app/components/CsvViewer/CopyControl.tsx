"use client";

import { useState } from "react";
import { styled } from "@linaria/react";
import { Keys, useKeyboardShortcuts } from "@/app/components/KeyboardShortcuts";

const ESCAPE_SHORTCUT = { primaryKey: Keys.Escape };

export interface CopyControlProps {
  disabled?: boolean;
  hasSelection: boolean;
  hasActiveFilter: boolean;
  onCopyAll: () => void;
  onCopySelected: () => void;
  onCopyFiltered: () => void;
}

export default function CopyControl({
  disabled = false,
  hasSelection,
  hasActiveFilter,
  onCopyAll,
  onCopySelected,
  onCopyFiltered,
}: CopyControlProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useKeyboardShortcuts(
    ESCAPE_SHORTCUT,
    () => setIsMenuOpen(false),
    [],
    { enabled: isMenuOpen }
  );

  const hasContextualOption = hasSelection || hasActiveFilter;

  if (disabled || !hasContextualOption) {
    return (
      <SimpleButton type="button" onClick={onCopyAll} disabled={disabled}>
        Copy
      </SimpleButton>
    );
  }

  const primaryLabel = hasSelection ? "Copy selected cells" : "Copy filtered rows";
  const primaryAction = hasSelection ? onCopySelected : onCopyFiltered;

  return (
    <Split
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsMenuOpen(false);
        }
      }}
    >
      <Primary
        type="button"
        onClick={() => {
          primaryAction();
          setIsMenuOpen(false);
        }}
      >
        {primaryLabel}
      </Primary>
      <Caret
        type="button"
        aria-label="More copy options"
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen((prev) => !prev)}
      >
        <CaretIcon aria-hidden="true">▾</CaretIcon>
      </Caret>
      {isMenuOpen && (
        <Menu role="menu">
          {hasSelection && hasActiveFilter && (
            <MenuItem
              type="button"
              role="menuitem"
              onClick={() => {
                setIsMenuOpen(false);
                onCopyFiltered();
              }}
            >
              Copy filtered rows
            </MenuItem>
          )}
          <MenuItem
            type="button"
            role="menuitem"
            onClick={() => {
              setIsMenuOpen(false);
              onCopyAll();
            }}
          >
            Copy all rows
          </MenuItem>
        </Menu>
      )}
    </Split>
  );
}

const SimpleButton = styled.button`
  background: transparent;
  color: var(--foreground);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--subtle);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const Split = styled.div`
  position: relative;
  display: inline-flex;
  align-items: stretch;
`;

const Primary = styled.button`
  background: transparent;
  color: var(--foreground);
  border: 1px solid var(--border);
  border-right: none;
  border-radius: 6px 0 0 6px;
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
  cursor: pointer;

  &:hover {
    background: var(--subtle);
  }
`;

const Caret = styled.button`
  background: transparent;
  color: var(--foreground);
  border: 1px solid var(--border);
  border-radius: 0 6px 6px 0;
  padding: 0.35rem 0.4rem;
  font-size: 0.7rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: var(--subtle);
  }
`;

const CaretIcon = styled.span`
  line-height: 1;
`;

const Menu = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 6px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  min-width: 180px;
  padding: 0.25rem;
  z-index: 100;
`;

const MenuItem = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  background: transparent;
  color: var(--foreground);
  border: none;
  border-radius: 4px;
  padding: 0.4rem 0.6rem;
  font-size: 0.85rem;
  cursor: pointer;

  &:hover {
    background: var(--subtle);
  }
`;
