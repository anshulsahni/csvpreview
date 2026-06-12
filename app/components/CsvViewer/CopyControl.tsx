"use client";

import { useEffect, useRef, useState } from "react";
import { styled } from "@linaria/react";
import { Keys, useKeyboardShortcuts } from "@/app/components/KeyboardShortcuts";

const ESCAPE_SHORTCUT = { primaryKey: Keys.Escape };
const FEEDBACK_DURATION_MS = 1500;

type CopyStatus = "idle" | "success" | "error";

export interface CopyControlProps {
  disabled?: boolean;
  hasSelection: boolean;
  hasActiveFilter: boolean;
  onCopyAll: () => Promise<void>;
  onCopySelected: () => Promise<void>;
  onCopyFiltered: () => Promise<void>;
}

export default function CopyControl({
  disabled = false,
  hasSelection,
  hasActiveFilter,
  onCopyAll,
  onCopySelected,
  onCopyFiltered,
}: CopyControlProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  useKeyboardShortcuts(
    ESCAPE_SHORTCUT,
    () => setIsMenuOpen(false),
    [],
    { enabled: isMenuOpen }
  );

  async function triggerCopy(action: () => Promise<void>) {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    try {
      await action();
      setCopyStatus("success");
    } catch (err) {
      console.error("Copy failed:", err);
      setCopyStatus("error");
    }
    resetTimer.current = setTimeout(() => setCopyStatus("idle"), FEEDBACK_DURATION_MS);
  }

  const hasContextualOption = hasSelection || hasActiveFilter;

  if (disabled || !hasContextualOption) {
    return (
      <Wrapper>
        {copyStatus !== "idle" && (
          <Toast data-status={copyStatus} role="status">
            {copyStatus === "success" ? "Copied!" : "Failed to copy"}
          </Toast>
        )}
        <SimpleButton
          type="button"
          onClick={() => triggerCopy(onCopyAll)}
          disabled={disabled}
        >
          Copy
        </SimpleButton>
      </Wrapper>
    );
  }

  const primaryLabel = hasSelection ? "Copy selected cells" : "Copy filtered rows";
  const primaryAction = hasSelection ? onCopySelected : onCopyFiltered;

  return (
    <Wrapper
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsMenuOpen(false);
        }
      }}
    >
      {copyStatus !== "idle" && (
        <Toast data-status={copyStatus} role="status">
          {copyStatus === "success" ? "Copied!" : "Failed to copy"}
        </Toast>
      )}
      <Split>
        <Primary
          type="button"
          onClick={() => {
            triggerCopy(primaryAction);
            setIsMenuOpen(false);
          }}
        >
          {primaryLabel}
        </Primary>
        <Caret
          type="button"
          aria-label="More copy options"
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          <CaretIcon aria-hidden="true">▾</CaretIcon>
        </Caret>
        {isMenuOpen && (
          <Menu role="menu">
            {hasSelection && hasActiveFilter && (
              <MenuItem
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsMenuOpen(false);
                  triggerCopy(onCopyFiltered);
                }}
              >
                Copy filtered rows
              </MenuItem>
            )}
            <MenuItem
              type="button"
              role="menuitem"
              onClick={() => {
                setIsMenuOpen(false);
                triggerCopy(onCopyAll);
              }}
            >
              Copy all rows
            </MenuItem>
          </Menu>
        )}
      </Split>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: relative;
  display: inline-flex;
  align-items: stretch;
`;

const Toast = styled.div`
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  pointer-events: none;
  animation: fadeIn 0.1s ease;

  &[data-status="success"] {
    background: var(--success, #22c55e);
    color: #fff;
  }

  &[data-status="error"] {
    background: var(--error, #ef4444);
    color: #fff;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateX(-50%) translateY(4px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
`;

const SimpleButton = styled.button`
  background: transparent;
  color: var(--foreground);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--subtle);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const Split = styled.div`
  display: inline-flex;
  align-items: stretch;
`;

const Primary = styled.button`
  background: transparent;
  color: var(--foreground);
  border: 1px solid var(--border);
  border-right: none;
  border-radius: 6px 0 0 6px;
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
  cursor: pointer;

  &:hover {
    background: var(--subtle);
  }
`;

const Caret = styled.button`
  background: transparent;
  color: var(--foreground);
  border: 1px solid var(--border);
  border-radius: 0 6px 6px 0;
  padding: 0.35rem 0.4rem;
  font-size: 0.7rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: var(--subtle);
  }
`;

const CaretIcon = styled.span`
  line-height: 1;
`;

const Menu = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 6px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  min-width: 180px;
  padding: 0.25rem;
  z-index: 100;
`;

const MenuItem = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  background: transparent;
  color: var(--foreground);
  border: none;
  border-radius: 4px;
  padding: 0.4rem 0.6rem;
  font-size: 0.85rem;
  cursor: pointer;

  &:hover {
    background: var(--subtle);
  }
`;
