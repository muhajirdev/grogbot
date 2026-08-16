export type Theme = "system" | "light" | "dark";

const KEY = "grogbot.theme";

export function readTheme(): Theme {
  const value = localStorage.getItem(KEY);
  if (value === "light" || value === "dark" || value === "system") return value;
  return "dark";
}

export function applyTheme(theme: Theme): void {
  localStorage.setItem(KEY, theme);
  const dark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}
