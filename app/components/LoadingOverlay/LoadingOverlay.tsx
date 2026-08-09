"use client";

import { styled } from "@linaria/react";
import Backdrop from "../Backdrop";

export interface LoadingOverlayProps {
  /** Primary line shown under the spinner. */
  message?: string;
  /** Optional secondary line (e.g. the file name being processed). */
  detail?: string;
}

/**
 * Full-screen, non-interactive overlay shown while a heavy CSV is being read
 * and parsed. Parsing runs synchronously on the main thread, so this gives the
 * user immediate feedback that the app is working rather than frozen.
 */
export default function LoadingOverlay({
  message = "Preparing your sheet…",
  detail,
}: LoadingOverlayProps) {
  return (
    <Backdrop level="overlay" role="status" aria-live="polite" aria-busy="true">
      <Panel>
        <Spinner aria-hidden="true" />
        <Message>{message}</Message>
        {detail && <Detail>{detail}</Detail>}
      </Panel>
    </Backdrop>
  );
}

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.85rem;
  padding: 1.5rem 2rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--background);
  color: var(--foreground);
  box-shadow: var(--overlay-shadow);
  max-width: min(90vw, 360px);
  text-align: center;
`;

const Spinner = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  animation: loadingOverlaySpin 0.8s linear infinite;

  @keyframes loadingOverlaySpin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Message = styled.p`
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
`;

const Detail = styled.p`
  margin: 0;
  font-size: 0.82rem;
  opacity: 0.7;
  overflow-wrap: anywhere;
`;
