"use client";

import { useCallback, useState } from "react";
import {
  THEME_COOKIE_KEY,
  THEME_COOKIE_MAX_AGE,
  Theme,
} from "@/lib/theme";

export function useThemeProvider(initialTheme: Theme) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    document.documentElement.dataset.theme = next;
    document.cookie = `${THEME_COOKIE_KEY}=${next};path=/;max-age=${THEME_COOKIE_MAX_AGE};samesite=lax`;
  }, []);

  return { theme, setTheme };
}
