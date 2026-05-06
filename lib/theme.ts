export enum Theme {
  Light = "light",
  Dark = "dark",
  System = "system",
}

export const THEME_COOKIE_KEY = "theme";
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isTheme(value: unknown): value is Theme {
  return (
    value === Theme.Light ||
    value === Theme.Dark ||
    value === Theme.System
  );
}
