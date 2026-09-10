"use client";

import { styled } from "@linaria/react";
import {
  Dropdown,
  DropdownItem,
  DropdownSeparator,
} from "@/app/components/Dropdown";
import type { DownloadFormat } from "@/lib/downloadFormats";
import { useDownloadControl } from "./useDownloadControl";

export interface DownloadControlProps {
  hasActiveFilter: boolean;
  selectedRowCount: number;
  /** JSON needs a header row to key its objects by. */
  canDownloadJson: boolean;
  onDownload: () => void;
  onDownloadAll: () => void;
  onDownloadSelected: () => void;
  onDownloadFormat: (format: DownloadFormat) => void;
}

export default function DownloadControl({
  hasActiveFilter,
  selectedRowCount,
  canDownloadJson,
  onDownload,
  onDownloadAll,
  onDownloadSelected,
  onDownloadFormat,
}: DownloadControlProps) {
  const control = useDownloadControl({
    hasActiveFilter,
    selectedRowCount,
    canDownloadJson,
    onDownloadAll,
    onDownloadSelected,
    onDownloadFormat,
  });

  return (
    <Split onBlur={control.handleBlur}>
      <Primary type="button" onClick={onDownload}>
        {control.primaryLabel}
      </Primary>
      <Caret
        type="button"
        aria-label="More download options"
        aria-haspopup="menu"
        aria-expanded={control.isMenuOpen}
        onClick={control.toggleMenu}
      >
        <CaretIcon aria-hidden="true">▾</CaretIcon>
      </Caret>
      {control.isMenuOpen && (
        <Dropdown>
          {control.extraOptions.map((option) => (
            <DropdownItem
              key={option.scope}
              onClick={() => control.handleOptionClick(option.scope)}
            >
              {option.label}
            </DropdownItem>
          ))}
          {control.extraOptions.length > 0 && <DropdownSeparator />}
          {/* `aria-disabled` rather than the native `disabled` attribute:
              disabled buttons swallow mouse events, so the `title` explaining
              *why* the option is unavailable would never surface on hover. */}
          {control.formatOptions.map((option) => (
            <DropdownItem
              key={option.format}
              aria-disabled={option.disabledReason !== undefined}
              title={option.disabledReason}
              onClick={() => control.handleFormatClick(option)}
            >
              {option.label}
            </DropdownItem>
          ))}
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
    background: var(--hover-surface);
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
    background: var(--hover-surface);
  }
`;

const CaretIcon = styled.span`
  line-height: 1;
`;
