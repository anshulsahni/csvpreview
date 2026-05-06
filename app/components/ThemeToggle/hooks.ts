"use client";

import { useTheme } from "@/app/components/ThemeProvider";
import { Theme } from "@/lib/theme";

export type ThemeToggleOption = {
  value: Theme;
  label: string;
};

export const THEME_TOGGLE_OPTIONS: ThemeToggleOption[] = [
  { value: Theme.Light, label: "Light" },
  { value: Theme.System, label: "System" },
  { value: Theme.Dark, label: "Dark" },
];

export function useThemeToggle() {
  const { theme, setTheme } = useTheme();
  return { theme, setTheme, options: THEME_TOGGLE_OPTIONS };
}
