"use client";

import { styled } from "@linaria/react";
import FileDropzone from "./FileDropzone";
import { useCsvToExcelConverter } from "./hooks";

export default function CsvToExcelConverter() {
  const vm = useCsvToExcelConverter();

  return (
    <Wrapper>
      <Hero>
        <EyebrowLabel>csv → excel</EyebrowLabel>
        <Heading>Free CSV to Excel converter</Heading>
        <Lede>
          Turn your CSV files into Excel spreadsheets right in your browser.
          Upload one or many CSVs, convert them to <code>.xlsx</code>, and
          download — your data never leaves your device.
        </Lede>
      </Hero>

      <FileDropzone
        isDragging={vm.isDragging}
        onFileInputChange={vm.handleFileInputChange}
        onDragEnter={vm.handleDragEnter}
        onDragOver={vm.handleDragOver}
        onDragLeave={vm.handleDragLeave}
        onDrop={vm.handleDrop}
      />

      {vm.rejectionMessage && <ErrorText>{vm.rejectionMessage}</ErrorText>}

      {vm.files.length > 0 && (
        <Panel>
          <PanelHeader>
            <SectionLabel>
              {vm.files.length === 1
                ? "1 file ready"
                : `${vm.files.length} files ready`}
            </SectionLabel>
            <ClearButton type="button" onClick={vm.clearFiles}>
              Clear all
            </ClearButton>
          </PanelHeader>

          <FileList>
            {vm.files.map((file) => (
              <FileRow key={file.id}>
                <FileMeta>
                  <FileName>{file.name}</FileName>
                  <FileStats>
                    {file.rowCount} {file.rowCount === 1 ? "row" : "rows"} ·{" "}
                    {file.columnCount}{" "}
                    {file.columnCount === 1 ? "column" : "columns"}
                    {file.errors.length > 0 && (
                      <Warning>
                        {" "}
                        · {file.errors.length} malformed{" "}
                        {file.errors.length === 1 ? "line" : "lines"}
                      </Warning>
                    )}
                  </FileStats>
                </FileMeta>
                <RemoveButton
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => vm.removeFile(file.id)}
                >
                  ×
                </RemoveButton>
              </FileRow>
            ))}
          </FileList>

          {vm.showModeChoice && (
            <ModeChoice>
              <SectionLabel>output</SectionLabel>
              <ModeOptions>
                <ModeOption data-active={vm.mode === "merge" || undefined}>
                  <input
                    type="radio"
                    name="output-mode"
                    value="merge"
                    checked={vm.mode === "merge"}
                    onChange={() => vm.setMode("merge")}
                  />
                  <ModeOptionBody>
                    <ModeOptionTitle>One workbook</ModeOptionTitle>
                    <ModeOptionDesc>
                      Merge every CSV into a single Excel file, one sheet per
                      CSV.
                    </ModeOptionDesc>
                  </ModeOptionBody>
                </ModeOption>
                <ModeOption data-active={vm.mode === "separate" || undefined}>
                  <input
                    type="radio"
                    name="output-mode"
                    value="separate"
                    checked={vm.mode === "separate"}
                    onChange={() => vm.setMode("separate")}
                  />
                  <ModeOptionBody>
                    <ModeOptionTitle>Separate files</ModeOptionTitle>
                    <ModeOptionDesc>
                      Download one Excel file per CSV, each named after its
                      source.
                    </ModeOptionDesc>
                  </ModeOptionBody>
                </ModeOption>
              </ModeOptions>
            </ModeChoice>
          )}

          {vm.showFilenameField && (
            <FilenameField>
              <FilenameLabel htmlFor="xlsx-filename">File name</FilenameLabel>
              <FilenameInput
                id="xlsx-filename"
                type="text"
                value={vm.filename}
                spellCheck={false}
                onChange={(event) => vm.setFilename(event.target.value)}
              />
            </FilenameField>
          )}

          <ConvertButton
            type="button"
            disabled={!vm.canConvert}
            onClick={vm.handleConvert}
            data-track-variant="convert-to-xlsx"
          >
            {vm.isConverting
              ? "Converting…"
              : vm.showModeChoice && vm.mode === "separate"
                ? "Download Excel files"
                : "Download Excel"}
          </ConvertButton>
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

const Hero = styled.div`
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

const ErrorText = styled.p`
  font-family: var(--font-mono);
  font-size: var(--text-sm);
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

const ClearButton = styled.button`
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.5px;
  color: var(--fg-muted);
  background: transparent;
  border: none;
  cursor: pointer;

  &:hover {
    color: var(--fg);
  }
`;

const FileList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
`;

const FileRow = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-4);
  padding: var(--s-3) var(--s-4);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  background: var(--bg);
`;

const FileMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const FileName = styled.span`
  font-size: var(--text-md);
  color: var(--fg);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FileStats = styled.span`
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--fg-subtle);
`;

const Warning = styled.span`
  color: var(--mustard-700);
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

const ModeChoice = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
`;

const ModeOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
`;

const ModeOption = styled.label`
  display: flex;
  align-items: flex-start;
  gap: var(--s-3);
  padding: var(--s-3) var(--s-4);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  background: var(--bg);
  cursor: pointer;

  &[data-active] {
    border-color: var(--primary);
    background: var(--green-100);
  }

  input {
    margin-top: 3px;
    accent-color: var(--primary);
  }
`;

const ModeOptionBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ModeOptionTitle = styled.span`
  font-size: var(--text-md);
  color: var(--fg);
`;

const ModeOptionDesc = styled.span`
  font-size: var(--text-sm);
  color: var(--fg-muted);
`;

const FilenameField = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
`;

const FilenameLabel = styled.label`
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--fg-subtle);
`;

const FilenameInput = styled.input`
  font-family: var(--font-mono);
  font-size: var(--text-md);
  color: var(--fg);
  background: var(--bg);
  border: 1px solid var(--border-strong);
  border-radius: var(--r-md);
  padding: var(--s-3) var(--s-4);

  &:focus {
    outline: 2px solid var(--primary);
    outline-offset: 1px;
  }
`;

const ConvertButton = styled.button`
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
