"use client";

import { useCallback, type ChangeEvent } from "react";

export interface UseToolbarArgs {
  firstRowAsHeader: boolean;
  onFirstRowAsHeaderChange: (value: boolean) => void;
}

export interface UseToolbarReturn {
  handleFirstRowAsHeaderChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function useToolbar({ onFirstRowAsHeaderChange }: UseToolbarArgs): UseToolbarReturn {

  const handleFirstRowAsHeaderChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onFirstRowAsHeaderChange(event.target.checked);
    },
    [onFirstRowAsHeaderChange]
  );

  return {
    handleFirstRowAsHeaderChange,
  };
}
