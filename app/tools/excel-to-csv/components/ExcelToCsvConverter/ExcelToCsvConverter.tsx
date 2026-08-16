"use client";

import { useRef } from "react";
import Link from "next/link";
import { styled } from "@linaria/react";
import FileDropzone from "@/app/components/FileDropzone";
import SheetRow from "./SheetRow";
import { LIMITS_HINT, useExcelToCsvConverter } from "./hooks";

export default function ExcelToCsvConverter() {
  const vm = useExcelToCsvConverter();
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  const hasWorkbooks = vm.workbooks.length > 0;
  const isLocked = vm.busySheetId !== null || vm.isZipping;

  return (
    <Wrapper>
      <Hero>
        <EyebrowLabel>excel → csv</EyebrowLabel>
        <Heading>Free Excel to CSV converter</Heading>
        <Lede>
          Turn an Excel workbook into clean <code>.csv</code> files right in
          your browser. Every worksheet becomes its own CSV — rename it,
          download it or copy it.
        </Lede>
        <HowItWorks>
          <li>One sheet becomes one CSV</li>
          <li>Formulas come through as their computed values</li>
          <li>Nothing leaves your browser</li>
        </HowItWorks>
        <CrossLink>
          Need the other direction?{" "}
          <Link href="/tools/csv-to-excel">Convert CSV to Excel</Link>
        </CrossLink>
      </Hero>

      {!hasWorkbooks && (
        <FileDropzone
          isDragging={vm.isDragging}
          accept=".xlsx"
          label="Drag &amp; drop Excel files here"
          buttonLabel="Choose Excel files"
          hint={LIMITS_HINT}
          onFileInputChange={vm.handleFileInputChange}
          onDragEnter={vm.handleDragEnter}
          onDragOver={vm.handleDragOver}
          onDragLeave={vm.handleDragLeave}
          onDrop={vm.handleDrop}
        />
      )}

      {vm.rejectionMessage && (
        <ErrorText role="alert">{vm.rejectionMessage}</ErrorText>
      )}

      {hasWorkbooks && (
        <Panel>
          <PanelHeader>
            <SectionLabel>
              {vm.totalSheetCount === 1
                ? "1 sheet ready"
                : `${vm.totalSheetCount} sheets ready`}
            </SectionLabel>
            <PanelHeaderActions>
              <AddButton
                type="button"
                onClick={() => addMoreInputRef.current?.click()}
              >
                + Add more
              </AddButton>
              <ClearButton type="button" onClick={vm.clearAll}>
                Clear all
              </ClearButton>
            </PanelHeaderActions>
            <HiddenInput
              ref={addMoreInputRef}
              type="file"
              accept=".xlsx"
              multiple
              onChange={vm.handleFileInputChange}
            />
          </PanelHeader>

          {vm.workbooks.map((workbook) => (
            <WorkbookBlock key={workbook.id}>
              <WorkbookHeader>
                <WorkbookName>{workbook.name}</WorkbookName>
                <RemoveButton
                  type="button"
                  aria-label={`Remove ${workbook.name}`}
                  onClick={() => vm.removeWorkbook(workbook.id)}
                >
                  ×
                </RemoveButton>
              </WorkbookHeader>
              <SheetList>
                {workbook.sheets.map((sheet) => (
                  <SheetRow
                    key={sheet.id}
                    sheet={sheet}
                    isBusy={vm.busySheetId === sheet.id}
                    isLocked={isLocked}
                    onRename={vm.renameCsv}
                    onDownload={vm.downloadOne}
                    onCopy={vm.copyOne}
                  />
                ))}
              </SheetList>
            </WorkbookBlock>
          ))}

          <DownloadAllButton
            type="button"
            disabled={!vm.canDownloadAll}
            onClick={vm.downloadAll}
            data-track-variant="download-all-csv"
          >
            {vm.isZipping ? "Zipping…" : "Download all as .zip"}
          </DownloadAllButton>
          <LimitsNote>{LIMITS_HINT}</LimitsNote>
        </Panel>
      )}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  max-width: 680px;
  margin: 0 auto;
  padding: var(--s-10) var(--s-8) var(--s-18);
  display: flex;
  flex-direction: column;
  gap: var(--s-6);
`;

const Hero = styled.header`
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
  padding-bottom: var(--s-2);
`;

const EyebrowLabel = styled.span`
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--primary);
`;

const Heading = styled.h1`
  font-family: var(--font-serif);
  font-size: var(--text-4xl);
  line-height: 1;
  letter-spacing: -1.5px;
  color: var(--fg);
`;

const Lede = styled.p`
  font-size: var(--text-lg);
  line-height: 1.6;
  color: var(--fg-muted);

  code {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--primary);
    background: var(--green-100);
    padding: 1px 5px;
    border-radius: var(--r-sm);
  }
`;

const HowItWorks = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2) var(--s-4);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.5px;
  color: var(--fg-subtle);

  li {
    display: flex;
    align-items: center;
    gap: var(--s-2);
  }

  li + li::before {
    content: "·";
    color: var(--border-strong);
  }
`;

const CrossLink = styled.p`
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--fg-subtle);

  a {
    color: var(--primary);
    text-decoration: underline;

    &:hover {
      color: var(--primary-hover);
    }
  }
`;

const ErrorText = styled.p`
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: 1.6;
  color: var(--red-600);
`;

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--s-6);
  padding: var(--s-6);
  border: 1px solid var(--border);
  border-radius: var(--r-xl);
  background: var(--surface);
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SectionLabel = styled.span`
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--fg-subtle);
`;

const PanelHeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--s-4);
`;

const AddButton = styled.button`
  font-family: var(--font-mono);
  font-size: var(--text-md);
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--primary);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: var(--s-2) var(--s-3);

  &:hover {
    color: var(--primary-hover);
  }
`;

const ClearButton = styled.button`
  font-family: var(--font-mono);
  font-size: var(--text-md);
  font-weight: 200;
  letter-spacing: 0.5px;
  color: var(--fg-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: var(--s-2) var(--s-3);

  &:hover {
    color: var(--fg);
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const WorkbookBlock = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
`;

const WorkbookHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-4);
`;

const WorkbookName = styled.h2`
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--fg);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RemoveButton = styled.button`
  flex-shrink: 0;
  font-size: var(--text-lg);
  line-height: 1;
  color: var(--fg-subtle);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: var(--s-1);

  &:hover {
    color: var(--red-600);
  }
`;

const SheetList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
`;

const DownloadAllButton = styled.button`
  font-family: var(--font-mono);
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--on-primary);
  background: var(--primary);
  border: none;
  border-radius: var(--r-pill);
  padding: var(--s-4) var(--s-6);
  cursor: pointer;
  transition: background 0.15s;

  &:hover:not(:disabled) {
    background: var(--primary-hover);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LimitsNote = styled.p`
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--fg-subtle);
  text-align: center;
`;
