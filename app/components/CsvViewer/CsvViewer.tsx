"use client";

import { styled } from "@linaria/react";
import SpreadsheetGrid from "../SpreadsheetGrid";
import Toolbar from "../Toolbar";
import CountPills from "../CountPills";
import UploadModal from "../UploadModal";
import DownloadModal from "../DownloadModal";
import ConfirmModal from "../ConfirmModal";
import DownloadControl from "./DownloadControl";
import CopyControl from "./CopyControl";
import DeleteSelectedControl from "./DeleteSelectedControl";
import { useCsvViewer } from "./hooks";

export default function CsvViewer() {
  const viewer = useCsvViewer();

  return (
    <Wrapper>
      <TopBar>
        <UploadButton type="button" onClick={viewer.openUpload}>
          Upload
        </UploadButton>
        <Toolbar
          firstRowAsHeader={viewer.firstRowAsHeader}
          onFirstRowAsHeaderChange={viewer.setFirstRowAsHeader}
        />
        <CopyControl
          disabled={!viewer.csvData}
          hasSelection={viewer.hasSelection}
          hasActiveFilter={viewer.hasActiveFilter}
          selectedRowCount={viewer.selectedRowCount}
          onCopyAll={viewer.handleCopyAll}
          onCopySelected={viewer.handleCopySelected}
          onCopyFiltered={viewer.handleCopyFiltered}
          onCopySelectedRows={viewer.handleCopySelectedRows}
        />
        {viewer.csvData && (
          <DownloadControl
            hasActiveFilter={viewer.hasActiveFilter}
            selectedRowCount={viewer.selectedRowCount}
            onDownload={viewer.openDownload}
            onDownloadAll={viewer.openDownloadAllRows}
            onDownloadSelected={viewer.openDownloadSelected}
          />
        )}
        {viewer.csvData && (
          <DeleteSelectedControl
            selectedRowCount={viewer.selectedRowCount}
            onDeleteSelected={viewer.requestDeleteSelected}
          />
        )}
        {viewer.csvData && (
          <ClearButton type="button" onClick={viewer.handleClear}>
            Clear
          </ClearButton>
        )}
        {viewer.csvData && (
          <PillsSlot>
            <CountPills
              rowCount={viewer.counts.visibleRowCount}
              totalRowCount={viewer.counts.totalRowCount}
              columnCount={viewer.counts.columnCount}
              hasActiveFilter={viewer.hasActiveFilter}
            />
          </PillsSlot>
        )}
      </TopBar>
      <GridArea>
        <SpreadsheetGrid
          data={viewer.csvData ?? []}
          firstRowAsHeader={viewer.firstRowAsHeader}
          onCellChange={viewer.handleCellChange}
          onExportStateChange={viewer.handleExportStateChange}
          onSelectionChange={viewer.handleSelectionChange}
          onRowSelectionChange={viewer.handleRowSelectionChange}
        />
      </GridArea>
      <UploadModal
        isOpen={viewer.isUploadOpen}
        onClose={viewer.closeUpload}
        onFilePicked={viewer.handleFilePicked}
        onPasteSubmit={viewer.handlePasteSubmit}
        onStartBlank={viewer.handleStartBlank}
        errors={viewer.parseErrors}
      />
      {viewer.isDownloadOpen && (
        <DownloadModal
          isOpen
          onClose={viewer.closeDownload}
          defaultFilename={viewer.defaultDownloadFilename}
          onDownload={viewer.handleDownload}
        />
      )}
      <ConfirmModal
        isOpen={viewer.isConfirmDeleteOpen}
        title="Delete selected rows"
        message={`Delete ${viewer.selectedRowCount} ${
          viewer.selectedRowCount === 1 ? "row" : "rows"
        }? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={viewer.confirmDeleteSelected}
        onCancel={viewer.cancelDeleteSelected}
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


const PillsSlot = styled.div`
  margin-left: auto;
  display: inline-flex;
  align-items: center;
`;

const GridArea = styled.div`
  flex: 1;
  overflow: hidden;
`;
