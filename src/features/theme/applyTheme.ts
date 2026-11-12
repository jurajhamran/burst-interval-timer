import type { ThemeMode } from "./store";

export function resolveTheme(theme: ThemeMode): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

export function applyTheme(theme: ThemeMode): void {
  const resolved = resolveTheme(theme);
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute(
      "content",
      resolved === "dark" ? "#0a0c10" : "#f4f5f7"
    );
  }
}
