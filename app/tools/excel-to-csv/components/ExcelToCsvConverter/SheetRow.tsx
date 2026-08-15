"use client";

import { styled } from "@linaria/react";
import type { SheetEntry } from "./hooks";

export interface SheetRowProps {
  sheet: SheetEntry;
  /** True while this sheet is being parsed. */
  isBusy: boolean;
  /** True while any sheet is being parsed, so we block double-clicks. */
  isLocked: boolean;
  onRename: (sheetId: string, value: string) => void;
  onDownload: (sheetId: string) => void;
  onCopy: (sheetId: string) => void;
}

/** One worksheet: its editable CSV name plus the two per-sheet actions. */
export default function SheetRow({
  sheet,
  isBusy,
  isLocked,
  onRename,
  onDownload,
  onCopy,
}: SheetRowProps) {
  const inputId = `csv-name-${sheet.id}`;

  return (
    <Row>
      <SheetName title={sheet.sheetName}>{sheet.sheetName}</SheetName>
      <NameLabel htmlFor={inputId}>CSV file name</NameLabel>
      <NameInput
        id={inputId}
        type="text"
        value={sheet.csvName}
        spellCheck={false}
        onChange={(event) => onRename(sheet.id, event.target.value)}
      />
      <Actions>
        <ActionButton
          type="button"
          disabled={isLocked}
          aria-label={`Download ${sheet.sheetName} as CSV`}
          onClick={() => onDownload(sheet.id)}
        >
          {isBusy ? "Working…" : "Download"}
        </ActionButton>
        <ActionButton
          type="button"
          disabled={isLocked}
          aria-label={`Copy ${sheet.sheetName} as CSV`}
          onClick={() => onCopy(sheet.id)}
        >
          Copy
        </ActionButton>
      </Actions>
    </Row>
  );
}

const Row = styled.li`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr) auto;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-3) var(--s-4);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  background: var(--bg);

  @media (max-width: 720px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const SheetName = styled.span`
  font-size: var(--text-md);
  color: var(--fg);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/**
 * The visible sheet name already labels the row, so the input's own label is
 * exposed to assistive tech only rather than repeated on screen.
 */
const NameLabel = styled.label`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

const NameInput = styled.input`
  min-width: 0;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--fg);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--r-sm);
  padding: var(--s-2) var(--s-3);

  &:focus {
    outline: 2px solid var(--primary);
    outline-offset: 1px;
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--s-2);
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 600;
  white-space: nowrap;
  color: var(--primary);
  background: transparent;
  border: 1px solid var(--border-strong);
  border-radius: var(--r-pill);
  padding: var(--s-2) var(--s-3);
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;

  &:hover:not(:disabled) {
    border-color: var(--primary);
    color: var(--primary-hover);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
