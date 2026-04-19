"use client";

import { useRef } from "react";
import { styled } from "@linaria/react";
import type { ParseError } from "@/lib/csvParser";
import { useUploadModal } from "./hooks";

export interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFilePicked: (file: File) => void;
  onPasteSubmit: (text: string) => void;
  onStartBlank: () => void;
  errors: ParseError[];
}

export default function UploadModal(props: UploadModalProps) {
  const modal = useUploadModal(props);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!props.isOpen) return null;

  return (
    <Backdrop onClick={modal.handleBackdropClick} role="presentation">
      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-modal-title"
        onClick={modal.handleCardClick}
      >
        <Header>
          <Title id="upload-modal-title">Upload Data</Title>
          <CloseButton
            type="button"
            aria-label="Close upload modal"
            onClick={modal.handleCloseClick}
          >
            ×
          </CloseButton>
        </Header>

        <DropZone
          data-dragging={modal.isDragging}
          onDragEnter={modal.handleDragEnter}
          onDragOver={modal.handleDragOver}
          onDragLeave={modal.handleDragLeave}
          onDrop={modal.handleDrop}
        >
          <DropZoneHint>Drag a .csv file anywhere in this area</DropZoneHint>
          <PickerButton
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            Accepts: .csv files only
          </PickerButton>
          <HiddenFileInput
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={modal.handleFileInputChange}
            aria-label="Choose a .csv file"
          />
          {modal.fileRejectionMessage && (
            <RejectionMessage>{modal.fileRejectionMessage}</RejectionMessage>
          )}
        </DropZone>

        <Divider>— or paste CSV below —</Divider>

        <PasteArea
          value={modal.pastedText}
          onChange={(event) => modal.setPastedText(event.target.value)}
          onKeyDown={modal.handlePasteKeyDown}
          placeholder="Paste your CSV content here… (Ctrl+V)"
          rows={5}
          aria-label="Paste CSV content"
        />

        {props.errors.length > 0 && (
          <ErrorPanel role="alert">
            {props.errors.map((error, index) => (
              <ErrorLine key={`${error.line}-${index}`}>
                Line {error.line}: {error.message}
              </ErrorLine>
            ))}
          </ErrorPanel>
        )}

        <Footer>
          <StartBlankButton type="button" onClick={modal.handleStartBlankClick}>
            Start with a blank sheet
          </StartBlankButton>
        </Footer>
      </Card>
    </Backdrop>
  );
}

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const Card = styled.div`
  width: 100%;
  max-width: 560px;
  background: var(--background);
  color: var(--foreground);
  border: 2px solid var(--primary);
  border-radius: 12px;
  padding: 1.25rem 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
  max-height: calc(100vh - 2rem);
  overflow: auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

const Title = styled.h2`
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
`;

const CloseButton = styled.button`
  background: #e11d48;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  width: 28px;
  height: 28px;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #be123c;
  }
`;

const DropZone = styled.div`
  border: 2px dashed #60a5fa;
  border-radius: 8px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  background: rgba(96, 165, 250, 0.08);
  transition: background 120ms ease, border-color 120ms ease;

  &[data-dragging="true"] {
    background: rgba(96, 165, 250, 0.2);
    border-color: var(--primary);
  }
`;

const DropZoneHint = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: var(--foreground);
  opacity: 0.8;
  text-align: center;
`;

const PickerButton = styled.button`
  background: var(--primary);
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 0.9rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    filter: brightness(0.95);
  }
`;

const HiddenFileInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
`;

const RejectionMessage = styled.p`
  margin: 0;
  color: #dc2626;
  font-size: 0.85rem;
`;

const Divider = styled.div`
  text-align: center;
  font-size: 0.8rem;
  color: var(--foreground);
  opacity: 0.55;
`;

const PasteArea = styled.textarea`
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.85rem;
  background: var(--grid-cell-bg);
  color: var(--foreground);
  resize: vertical;
  min-height: 96px;

  &:focus {
    outline: 2px solid var(--primary);
    outline-offset: 1px;
  }
`;

const ErrorPanel = styled.div`
  border: 1px solid #fca5a5;
  background: rgba(220, 38, 38, 0.08);
  color: #b91c1c;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  max-height: 140px;
  overflow: auto;
`;

const ErrorLine = styled.div`
  line-height: 1.35;
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-top: 0.25rem;
`;

const StartBlankButton = styled.button`
  background: transparent;
  color: var(--primary);
  border: 1px solid var(--primary);
  border-radius: 6px;
  padding: 0.45rem 0.85rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: rgba(0, 112, 243, 0.08);
  }
`;
