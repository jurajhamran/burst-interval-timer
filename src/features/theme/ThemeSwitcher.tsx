import { Sun, Monitor, Moon } from "lucide-react";
import { useThemeStore, type ThemeMode } from "./store";

export function ThemeSwitcher({ showLabels = false }: { showLabels?: boolean }) {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  const options: {
    mode: ThemeMode;
    label: string;
    ariaLabel: string;
    icon: typeof Sun;
  }[] = [
    { mode: "light", label: "Light", ariaLabel: "Light theme", icon: Sun },
    { mode: "system", label: "System", ariaLabel: "System theme", icon: Monitor },
    { mode: "dark", label: "Dark", ariaLabel: "Dark theme", icon: Moon },
  ];

  return (
    <div
      className={
        showLabels
          ? "flex w-full gap-1 rounded-full bg-surface-3 p-1"
          : "inline-flex rounded-full bg-surface-3 p-1"
      }
    >
      {options.map(({ mode, label, ariaLabel, icon: Icon }) => {
        const active = theme === mode;
        return (
          <button
            key={mode}
            type="button"
            aria-label={ariaLabel}
            aria-pressed={active}
            onClick={() => setTheme(mode)}
            className={
              showLabels
                ? `flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-surface-2 text-fg shadow-sm"
                      : "text-muted hover:text-fg"
                  }`
                : `size-8 rounded-full flex items-center justify-center transition-colors ${
                    active
                      ? "bg-surface-2 text-fg shadow-sm"
                      : "text-muted hover:text-fg"
                  }`
            }
          >
            <Icon className="size-4" />
            {showLabels && <span>{label}</span>}
          </button>
        );
      })}
    </div>
  );
}