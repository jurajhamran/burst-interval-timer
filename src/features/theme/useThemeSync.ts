import { useEffect } from "react";
import { useThemeStore } from "./store";
import { applyTheme } from "./applyTheme";

export function useThemeSync(): void {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    applyTheme(theme);
    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("system");
      media.addEventListener("change", handler);
      return () => media.removeEventListener("change", handler);
    }
  }, [theme]);
}
