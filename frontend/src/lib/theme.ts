export type ThemeMode = "light" | "dark";

const THEME_KEY = "theme";

const getSystemTheme = (): ThemeMode =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

export const getInitialTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "light";

  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") {
    return saved;
  }

  return getSystemTheme();
};

export const applyTheme = (theme: ThemeMode): void => {
  document.documentElement.classList.toggle("dark", theme === "dark");
};

export const setThemePreference = (theme: ThemeMode): void => {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
};

export const initializeTheme = (): ThemeMode => {
  const initial = getInitialTheme();
  applyTheme(initial);
  return initial;
};

