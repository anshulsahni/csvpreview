export type Theme = "light" | "dark" | "system";

export const THEME_COOKIE_KEY = "theme";
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}
