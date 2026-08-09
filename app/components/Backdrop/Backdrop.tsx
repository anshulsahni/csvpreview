"use client";

import { styled } from "@linaria/react";
import type { ComponentPropsWithoutRef } from "react";

/**
 * Where the backdrop sits in the stacking order.
 * - `modal` — dismissable dialogs (upload, download, confirm).
 * - `overlay` — blocking feedback that must cover dialogs too, e.g. the parsing
 *   loader, which is triggered from inside the upload modal.
 */
export type BackdropLevel = "modal" | "overlay";

export interface BackdropProps extends ComponentPropsWithoutRef<"div"> {
  /** Stacking level. Defaults to `modal`. */
  level?: BackdropLevel;
}

/**
 * Full-screen dimmed scrim that centers its content.
 *
 * It owns the scrim only — the card/panel inside stays with the caller, as do
 * semantics and behavior (`role`, `aria-*`, click-to-dismiss), which pass
 * straight through.
 */
export default function Backdrop({
  level = "modal",
  children,
  ...rest
}: BackdropProps) {
  return (
    <Scrim data-level={level} {...rest}>
      {children}
    </Scrim>
  );
}

const Scrim = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: var(--backdrop);

  &[data-level="overlay"] {
    z-index: 2000;
  }
`;
