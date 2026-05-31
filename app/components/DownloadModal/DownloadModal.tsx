"use client";

import { styled } from "@linaria/react";
import { useDownloadModal, type DownloadModalRenderProps } from "./hooks";

export type DownloadModalProps = DownloadModalRenderProps;

export default function DownloadModal(props: DownloadModalProps) {
  const modal = useDownloadModal(props);

  if (!props.isOpen) return null;

  const rangeLabel = props.selectionLabel
    ? `Selected range only - ${props.selectionLabel}`
    : "Selected range only";

  return (
    <Backdrop onClick={modal.handleBackdropClick} role="presentation">
      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-modal-title"
        onClick={modal.handleCardClick}
      >
        <Header>
          <Title id="download-modal-title">Download CSV</Title>
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
            <FilenameInput
              id="download-filename"
              type="text"
              value={modal.filename}
              onChange={(event) => modal.setFilename(event.target.value)}
              aria-label="Download filename"
            />
          </Field>

          <Fieldset>
            <Legend>What to export</Legend>
            <RadioOption>
              <input
                type="radio"
                name="download-scope"
                value="full"
                checked={modal.scope === "full"}
                onChange={() => modal.setScope("full")}
              />
              <span>Full CSV</span>
            </RadioOption>
            <RadioOption data-disabled={!props.hasSelection ? "true" : undefined}>
              <input
                type="radio"
                name="download-scope"
                value="range"
                checked={modal.scope === "range"}
                disabled={!props.hasSelection}
                onChange={() => modal.setScope("range")}
              />
              <span>{rangeLabel}</span>
            </RadioOption>
          </Fieldset>

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
  max-width: 460px;
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

const FilenameInput = styled.input`
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  background: var(--grid-cell-bg);
  color: var(--foreground);

  &:focus {
    outline: 2px solid var(--primary);
    outline-offset: 1px;
  }
`;

const Fieldset = styled.fieldset`
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin: 0;
`;

const Legend = styled.legend`
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0 0.35rem;
  opacity: 0.8;
`;

const RadioOption = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;

  &[data-disabled="true"] {
    opacity: 0.45;
    cursor: not-allowed;
  }
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
