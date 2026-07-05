"use client";

import { styled } from "@linaria/react";
import { useConfirmModal, type ConfirmModalRenderProps } from "./hooks";

export type ConfirmModalProps = ConfirmModalRenderProps;

export default function ConfirmModal(props: ConfirmModalProps) {
  const {
    isOpen,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    onConfirm,
    onCancel,
  } = props;
  const modal = useConfirmModal({ isOpen, onCancel });

  if (!isOpen) return null;

  return (
    <Backdrop onClick={modal.handleBackdropClick} role="presentation">
      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onClick={modal.handleCardClick}
      >
        <Title id="confirm-modal-title">{title}</Title>
        <Message>{message}</Message>
        <Footer>
          <CancelButton type="button" onClick={onCancel}>
            {cancelLabel}
          </CancelButton>
          <ConfirmButton type="button" onClick={onConfirm} autoFocus>
            {confirmLabel}
          </ConfirmButton>
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
  max-width: 420px;
  background: var(--background);
  color: var(--foreground);
  border: 2px solid var(--primary);
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
  max-height: calc(100vh - 2rem);
  overflow: auto;
`;

const Title = styled.h2`
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
`;

const Message = styled.p`
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.25rem;
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

const ConfirmButton = styled.button`
  background: #e11d48;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 0.45rem 0.9rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #be123c;
  }
`;
