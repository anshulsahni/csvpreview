"use client";

import { styled } from "@linaria/react";
import Backdrop from "../Backdrop";
import { useDownloadModal, type DownloadModalRenderProps } from "./hooks";

export type DownloadModalProps = DownloadModalRenderProps;

export default function DownloadModal(props: DownloadModalProps) {
  const modal = useDownloadModal(props);

  if (!props.isOpen) return null;

  return (
    <Backdrop onClick={modal.handleBackdropClick} role="presentation">
      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-modal-title"
        onClick={modal.handleCardClick}
      >
        <Header>
          <Title id="download-modal-title">{modal.title}</Title>
          <CloseButton
            type="button"
            aria-label="Close download modal"
            onClick={modal.handleCloseClick}
          >
            &times;
          </CloseButton>
        </Header>

        <Form onSubmit={modal.handleSubmit}>
          <Field>
            <FieldLabel htmlFor="download-filename">Filename</FieldLabel>
            {/* The extension is fixed by the chosen format, so it sits outside
                the input as a read-only chip — the row is styled to read as one
                control. */}
            <FilenameRow>
              <FilenameInput
                id="download-filename"
                type="text"
                value={modal.baseName}
                onChange={(event) => modal.setBaseName(event.target.value)}
                aria-label="Download filename"
                aria-describedby="download-filename-extension"
                autoFocus={true}
              />
              <ExtensionChip id="download-filename-extension">
                {modal.extension}
              </ExtensionChip>
            </FilenameRow>
          </Field>

          <Footer>
            <CancelButton type="button" onClick={modal.handleCloseClick}>
              Cancel
            </CancelButton>
            <DownloadButton type="submit" disabled={!modal.canDownload}>
              Download
            </DownloadButton>
          </Footer>
        </Form>
      </Card>
    </Backdrop>
  );
}

const Card = styled.div`
  width: 100%;
  max-width: 460px;
  background: var(--background);
  color: var(--foreground);
  border: 2px solid var(--primary);
  border-radius: 12px;
  padding: 1.25rem 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-shadow: var(--overlay-shadow);
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

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const FieldLabel = styled.label`
  font-size: 0.85rem;
  font-weight: 600;
`;

const FilenameRow = styled.div`
  display: flex;
  align-items: stretch;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--grid-cell-bg);
  overflow: hidden;

  &:focus-within {
    outline: 2px solid var(--primary);
    outline-offset: 1px;
  }
`;

const FilenameInput = styled.input`
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  color: var(--foreground);

  &:focus {
    outline: none;
  }
`;

const ExtensionChip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-left: 1px solid var(--border);
  background: var(--subtle);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--muted-foreground);
  user-select: none;
  white-space: nowrap;
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;

const CancelButton = styled.button`
  background: transparent;
  color: var(--foreground);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.45rem 0.9rem;
  font-size: 0.85rem;
  cursor: pointer;

  &:hover {
    background: var(--subtle);
  }
`;

const DownloadButton = styled.button`
  background: var(--primary);
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 0.45rem 0.9rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    filter: brightness(0.95);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;
