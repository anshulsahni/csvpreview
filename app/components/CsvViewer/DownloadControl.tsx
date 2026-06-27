"use client";

import { useState } from "react";
import { styled } from "@linaria/react";
import { Keys, useKeyboardShortcuts } from "@/app/components/KeyboardShortcuts";
import { Dropdown, DropdownItem } from "@/app/components/Dropdown";

const ESCAPE_SHORTCUT = { primaryKey: Keys.Escape };

export interface DownloadControlProps {
  hasActiveFilter: boolean;
  onDownload: () => void;
  onDownloadAll: () => void;
}

export default function DownloadControl({
  hasActiveFilter,
  onDownload,
  onDownloadAll,
}: DownloadControlProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useKeyboardShortcuts(
    ESCAPE_SHORTCUT,
    () => setIsMenuOpen(false),
    [],
    { enabled: isMenuOpen }
  );

  if (!hasActiveFilter) {
    return (
      <SimpleButton type="button" onClick={onDownload}>
        Download
      </SimpleButton>
    );
  }

  return (
    <Split
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsMenuOpen(false);
        }
      }}
    >
      <Primary type="button" onClick={onDownload}>
        Download filtered rows
      </Primary>
      <Caret
        type="button"
        aria-label="More download options"
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen((prev) => !prev)}
      >
        <CaretIcon aria-hidden="true">▾</CaretIcon>
      </Caret>
      {isMenuOpen && (
        <Dropdown>
          <DropdownItem
            onClick={() => {
              setIsMenuOpen(false);
              onDownloadAll();
            }}
          >
            Download all rows
          </DropdownItem>
        </Dropdown>
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

  &:hover {
    background: var(--subtle);
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
