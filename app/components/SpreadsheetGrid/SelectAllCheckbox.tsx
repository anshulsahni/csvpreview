"use client";

import { useEffect, useRef } from "react";
import type { SelectAllState } from "./rowSelectionUtils";

export interface SelectAllCheckboxProps {
  state: SelectAllState;
  onToggle: () => void;
}

/**
 * The header select-all checkbox. `indeterminate` is not expressible in JSX and
 * must be set on the DOM node, so it is wired through a ref effect here.
 */
export default function SelectAllCheckbox({
  state,
  onToggle,
}: SelectAllCheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = state === "some";
    }
  }, [state]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={state === "all"}
      onChange={onToggle}
      aria-label="Select all visible rows"
    />
  );
}
