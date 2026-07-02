"use client";

import { styled } from "@linaria/react";
import type { ParseError } from "@/lib/csvParser";

export interface ParseErrorBannerProps {
  errors: ParseError[];
  onDismiss: () => void;
}

export default function ParseErrorBanner({
  errors,
  onDismiss,
}: ParseErrorBannerProps) {
  if (errors.length === 0) return null;

  const count = errors.length;

  return (
    <Banner role="alert">
      <Header>
        <Summary>
          {count} {count === 1 ? "issue" : "issues"} found in the loaded CSV
        </Summary>
        <DismissButton
          type="button"
          aria-label="Dismiss error banner"
          onClick={onDismiss}
        >
          ×
        </DismissButton>
      </Header>
      <ErrorList>
        {errors.map((error, index) => (
          <ErrorLine key={`${error.line}-${index}`}>
            Line {error.line}: {error.message}
          </ErrorLine>
        ))}
      </ErrorList>
    </Banner>
  );
}

const Banner = styled.section`
  border: 1px solid var(--error);
  background: var(--grid-error-row-bg);
  color: var(--error);
  border-radius: 6px;
  margin: 0.5rem 1rem 0;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

const Summary = styled.strong`
  font-weight: 700;
`;

const DismissButton = styled.button`
  background: transparent;
  color: var(--error);
  border: none;
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 0.25rem;

  &:hover {
    filter: brightness(0.85);
  }

  &:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 1px;
  }
`;

const ErrorList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  max-height: 140px;
  overflow: auto;
`;

const ErrorLine = styled.div`
  line-height: 1.35;
`;
