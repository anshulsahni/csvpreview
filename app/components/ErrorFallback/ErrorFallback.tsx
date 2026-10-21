"use client";

import Link from "next/link";
import { styled } from "@linaria/react";
import { useReportError } from "./hooks";

export interface ErrorFallbackProps {
  /** The error caught by the boundary. Reported, never shown to the user. */
  error: Error;
  /** Re-fetch and re-render the boundary's children. */
  retry: () => void;
}

/**
 * Friendly screen shown by `app/error.tsx` and `app/global-error.tsx` when a
 * render crashes, instead of a blank page. It must not depend on any context
 * provider, because `global-error.tsx` renders without the root layout.
 */
export default function ErrorFallback({ error, retry }: ErrorFallbackProps) {
  useReportError(error);

  return (
    <Main>
      <Panel role="alert">
        <Title>Something went wrong</Title>
        <Message>
          This page hit an unexpected error. Your data stays in your browser.
          Try again, or go back to the viewer.
        </Message>
        <Actions>
          <PrimaryButton type="button" onClick={retry}>
            Try again
          </PrimaryButton>
          <HomeLink href="/">Go to Home</HomeLink>
        </Actions>
      </Panel>
    </Main>
  );
}

const Main = styled.main`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1.5rem;
  background: var(--background);
  color: var(--foreground);
`;

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  max-width: 420px;
  padding: 1.75rem 2rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  text-align: center;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.25rem;
`;

const Message = styled.p`
  margin: 0;
  font-size: 0.95rem;
  color: var(--muted-foreground);
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
`;

const PrimaryButton = styled.button`
  padding: 0.55rem 1.1rem;
  border: none;
  border-radius: 8px;
  background: var(--primary);
  color: var(--on-primary);
  font: inherit;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: var(--primary-hover);
  }
`;

const HomeLink = styled(Link)`
  padding: 0.55rem 1.1rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--foreground);
  text-decoration: none;

  &:hover {
    background: var(--hover-surface);
  }
`;
