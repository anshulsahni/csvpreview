"use client";

import { type ChangeEvent } from "react";

export interface UseToolbarArgs {
  firstRowAsHeader: boolean;
  onFirstRowAsHeaderChange: (value: boolean) => void;
}

export interface UseToolbarReturn {
  handleFirstRowAsHeaderChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function useToolbar({ onFirstRowAsHeaderChange }: UseToolbarArgs): UseToolbarReturn {
  // Plain function: this handler is only wired to a native <input onChange>,
  // which never memoizes on prop identity, and nothing depends on it — so
  // useCallback would add cost and noise for no benefit.
  const handleFirstRowAsHeaderChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFirstRowAsHeaderChange(event.target.checked);
  };

  return {
    handleFirstRowAsHeaderChange,
  };
}
