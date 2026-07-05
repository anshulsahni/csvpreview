"use client";

import { useState } from "react";
import { styled } from "@linaria/react";
import { Keys, useKeyboardShortcuts } from "@/app/components/KeyboardShortcuts";
import { Dropdown, DropdownItem } from "@/app/components/Dropdown";
import { useToast } from "@/app/components/Toast";

const ESCAPE_SHORTCUT = { primaryKey: Keys.Escape };

export interface CopyControlProps {
  disabled?: boolean;
  hasSelection: boolean;
  hasActiveFilter: boolean;
  selectedRowCount: number;
  onCopyAll: () => Promise<void>;
  onCopySelected: () => Promise<void>;
  onCopyFiltered: () => Promise<void>;
  onCopySelectedRows: () => Promise<void>;
}

interface CopyOption {
  label: string;
  action: () => Promise<void>;
}

export default function CopyControl({
  disabled = false,
  hasSelection,
  hasActiveFilter,
  selectedRowCount,
  onCopyAll,
  onCopySelected,
  onCopyFiltered,
  onCopySelectedRows,
}: CopyControlProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { success, error } = useToast();

  useKeyboardShortcuts(
    ESCAPE_SHORTCUT,
    () => setIsMenuOpen(false),
    [],
    { enabled: isMenuOpen }
  );

  async function triggerCopy(action: () => Promise<void>) {
    try {
      await action();
      success("Copied to clipboard");
    } catch (err) {
      console.error("Copy failed:", err);
      error("Failed to copy");
    }
  }

  const hasRowSelection = selectedRowCount > 0;

  // Build the ordered list of contextual copy options (most specific first).
  // The first one becomes the primary button; the rest fall into the dropdown,
  // which always ends with "Copy all rows".
  const contextualOptions: CopyOption[] = [];
  if (hasRowSelection) {
    contextualOptions.push({
      label: `Copy selected rows (${selectedRowCount})`,
      action: onCopySelectedRows,
    });
  }
  if (hasSelection) {
    contextualOptions.push({
      label: "Copy selected cells",
      action: onCopySelected,
    });
  }
  if (hasActiveFilter) {
    contextualOptions.push({
      label: "Copy filtered rows",
      action: onCopyFiltered,
    });
  }

  const primaryOption = contextualOptions[0];
  const dropdownOptions: CopyOption[] = [
    ...contextualOptions.slice(1),
    { label: "Copy all rows", action: onCopyAll },
  ];

  return (
    <Wrapper>
      {disabled || primaryOption === undefined ? (
        <SimpleButton
          type="button"
          onClick={() => triggerCopy(onCopyAll)}
          disabled={disabled}
        >
          Copy
        </SimpleButton>
      ) : (
        <Split>
          <Primary
            type="button"
            onClick={() => {
              triggerCopy(primaryOption.action);
              setIsMenuOpen(false);
            }}
          >
            {primaryOption.label}
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
            <Dropdown
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setIsMenuOpen(false);
                }
              }}
            >
              {dropdownOptions.map((option) => (
                <DropdownItem
                  key={option.label}
                  onClick={() => {
                    setIsMenuOpen(false);
                    triggerCopy(option.action);
                  }}
                >
                  {option.label}
                </DropdownItem>
              ))}
            </Dropdown>
          )}
        </Split>
      )}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: relative;
  display: inline-flex;
  align-items: stretch;
`;

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
