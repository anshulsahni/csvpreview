"use client";

import { useRef, type ChangeEvent, type DragEvent } from "react";
import { styled } from "@linaria/react";

export interface FileDropzoneProps {
  isDragging: boolean;
  onFileInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDragEnter: (event: DragEvent) => void;
  onDragOver: (event: DragEvent) => void;
  onDragLeave: (event: DragEvent) => void;
  onDrop: (event: DragEvent) => void;
}

export default function FileDropzone({
  isDragging,
  onFileInputChange,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Zone
      data-dragging={isDragging || undefined}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <ZoneText>Drag &amp; drop CSV files here</ZoneText>
      <ZoneHint>or</ZoneHint>
      <PickButton type="button" onClick={() => inputRef.current?.click()}>
        Choose CSV files
      </PickButton>
      <HiddenInput
        ref={inputRef}
        type="file"
        accept=".csv"
        multiple
        onChange={onFileInputChange}
      />
    </Zone>
  );
}

const Zone = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-14) var(--s-8);
  border: 2px dashed var(--border-strong);
  border-radius: var(--r-xl);
  background: var(--surface);
  text-align: center;
  transition: border-color 0.15s, background 0.15s;

  &[data-dragging] {
    border-color: var(--primary);
    background: var(--green-100);
  }
`;

const ZoneText = styled.span`
  font-family: var(--font-serif);
  font-size: var(--text-xl);
  color: var(--fg);
`;

const ZoneHint = styled.span`
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--fg-subtle);
`;

const PickButton = styled.button`
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--on-primary);
  background: var(--primary);
  border: none;
  border-radius: var(--r-pill);
  padding: var(--s-3) var(--s-6);
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: var(--primary-hover);
  }
`;

const HiddenInput = styled.input`
  display: none;
`;
