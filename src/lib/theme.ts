// Light / dark choice, saved per device in a cookie so the server can render
// the right colors. "system" follows the phone's setting.
export type ThemeChoice = "system" | "light" | "dark";

export const THEME_COOKIE = "theme";

export function parseTheme(value: string | undefined): ThemeChoice {
  return value === "light" || value === "dark" ? value : "system";
}

// Penny's "you're about to go over" check-in, also saved per device.
export const WARN_COOKIE = "warn_over";
