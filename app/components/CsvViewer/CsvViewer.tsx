"use client";

import { styled } from "@linaria/react";
import SpreadsheetGrid from "../SpreadsheetGrid";
import UploadModal from "../UploadModal";
import { useCsvViewer } from "./hooks";

export default function CsvViewer() {
  const viewer = useCsvViewer();

  return (
    <Wrapper>
      <TopBar>
        <UploadButton type="button" onClick={viewer.openUpload}>
          Upload
        </UploadButton>
        {viewer.csvData && (
          <ClearButton type="button" onClick={viewer.handleClear}>
            Clear
          </ClearButton>
        )}
        {viewer.fileName && <FileLabel>File: {viewer.fileName}</FileLabel>}
      </TopBar>
      <GridArea>
        <SpreadsheetGrid data={viewer.csvData ?? []} />
      </GridArea>
      <UploadModal
        isOpen={viewer.isUploadOpen}
        onClose={viewer.closeUpload}
        onFilePicked={viewer.handleFilePicked}
        onPasteSubmit={viewer.handlePasteSubmit}
        onStartBlank={viewer.handleStartBlank}
        errors={viewer.parseErrors}
      />
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const TopBar = styled.div`
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const UploadButton = styled.button`
  background: var(--primary);
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 0.4rem 0.85rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    filter: brightness(0.95);
  }
`;

const ClearButton = styled.button`
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

const FileLabel = styled.span`
  font-size: 0.85rem;
  color: var(--foreground);
  opacity: 0.6;
`;

const GridArea = styled.div`
  flex: 1;
  overflow: hidden;
`;
