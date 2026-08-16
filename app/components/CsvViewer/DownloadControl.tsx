"use client";

import { useState } from "react";
import { styled } from "@linaria/react";
import { Keys, useKeyboardShortcuts } from "@/app/components/KeyboardShortcuts";
import {
  Dropdown,
  DropdownItem,
  DropdownSeparator,
} from "@/app/components/Dropdown";

const ESCAPE_SHORTCUT = { primaryKey: Keys.Escape };

const JSON_DISABLED_REASON =
  'Enable "First row as header" to download JSON';

export interface DownloadControlProps {
  hasActiveFilter: boolean;
  selectedRowCount: number;
  /** JSON needs a header row to key its objects by. */
  canDownloadJson: boolean;
  onDownload: () => void;
  onDownloadAll: () => void;
  onDownloadSelected: () => void;
  onDownloadJson: () => void;
}

interface DownloadOption {
  label: string;
  action: () => void;
}

export default function DownloadControl({
  hasActiveFilter,
  selectedRowCount,
  canDownloadJson,
  onDownload,
  onDownloadAll,
  onDownloadSelected,
  onDownloadJson,
}: DownloadControlProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useKeyboardShortcuts(
    ESCAPE_SHORTCUT,
    () => setIsMenuOpen(false),
    [],
    { enabled: isMenuOpen }
  );

  // The primary button downloads the visible rows as CSV — the filtered set
  // when a filter is active, otherwise every row. Extra scopes go in the
  // dropdown, which also always carries the alternate JSON format.
  const extraOptions: DownloadOption[] = [];
  if (hasActiveFilter) {
    extraOptions.push({ label: "Download all rows", action: onDownloadAll });
  }
  if (selectedRowCount > 0) {
    extraOptions.push({
      label: `Download selected ${selectedRowCount === 1 ? "row" : "rows"} (${selectedRowCount})`,
      action: onDownloadSelected,
    });
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
        {hasActiveFilter ? "Download filtered rows" : "Download"}
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
          {extraOptions.map((option) => (
            <DropdownItem
              key={option.label}
              onClick={() => {
                setIsMenuOpen(false);
                option.action();
              }}
            >
              {option.label}
            </DropdownItem>
          ))}
          {extraOptions.length > 0 && <DropdownSeparator />}
          {/* `aria-disabled` rather than the native `disabled` attribute:
              disabled buttons swallow mouse events, so the `title` explaining
              *why* the option is unavailable would never surface on hover. */}
          <DropdownItem
            aria-disabled={!canDownloadJson}
            title={canDownloadJson ? undefined : JSON_DISABLED_REASON}
            onClick={() => {
              if (!canDownloadJson) return;
              setIsMenuOpen(false);
              onDownloadJson();
            }}
          >
            Download as JSON
          </DropdownItem>
        </Dropdown>
      )}
    </Split>
  );
}

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
