"use client";

import { useState } from "react";
import {
  THEME_COOKIE_KEY,
  THEME_COOKIE_MAX_AGE,
  Theme,
} from "@/lib/theme";

export function useThemeProvider(initialTheme: Theme) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  // Plain function: `setTheme` is only ever invoked imperatively from a click
  // handler, and the context value it feeds is a fresh object literal each
  // render, so a stable identity would buy nothing. (No React.memo consumer,
  // no hook depends on it.)
  const setTheme = (next: Theme) => {
    setThemeState(next);
    document.documentElement.dataset.theme = next;
    document.cookie = `${THEME_COOKIE_KEY}=${next};path=/;max-age=${THEME_COOKIE_MAX_AGE};samesite=lax`;
  };

  return { theme, setTheme };
}
