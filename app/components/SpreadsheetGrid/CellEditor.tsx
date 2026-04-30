"use client";

import React from "react";
import { styled } from "@linaria/react";

export interface CellEditorProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export default function CellEditor({
  value,
  onChange,
  onKeyDown,
}: CellEditorProps) {
  return (
    <EditorTextarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={onKeyDown}
      onFocus={(event) => {
        const el = event.currentTarget;
        const end = el.value.length;
        el.setSelectionRange(end, end);
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
      }}
      onInput={(event) => {
        const el = event.currentTarget;
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
      }}
      autoFocus
    />
  );
}

const EditorTextarea = styled.textarea`
  position: absolute;
  left: -4px;
  top: -4px;
  width: calc(100% + 8px);
  min-height: 33px;
  border: 2px solid var(--primary);
  border-radius: 4px;
  outline: 1px solid color-mix(in srgb, var(--primary) 35%, transparent);
  resize: none;
  overflow: hidden;
  padding: 6px;
  font: inherit;
  color: inherit;
  background: var(--grid-cell-bg);
  line-height: 1.2;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
  z-index: 7;
`;
