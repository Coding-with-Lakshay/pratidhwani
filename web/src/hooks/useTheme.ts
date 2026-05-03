import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "hc-light" | "hc-dark";
const KEY = "pratidhwani.theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readStoredTheme(): ThemeMode | null {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "light" || v === "dark" || v === "hc-light" || v === "hc-dark") return v;
  } catch {
    /* ignore */
  }
  return null;
}

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle("dark", theme === "dark" || theme === "hc-dark");
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => readStoredTheme() ?? getSystemTheme());

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    if (readStoredTheme()) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setThemeState(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const setTheme = useCallback((t: ThemeMode) => setThemeState(t), []);

  const cycle = useCallback(() => {
    setThemeState((prev) => {
      const order: ThemeMode[] = ["light", "dark", "hc-light", "hc-dark"];
      return order[(order.indexOf(prev) + 1) % order.length];
    });
  }, []);

  return { theme, setTheme, cycle };
}
