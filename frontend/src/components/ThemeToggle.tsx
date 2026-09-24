import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useState } from "react";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "tiny-safe-agent-theme";

const OPTIONS: { value: Theme; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function readTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // Storage can be blocked (private mode) - fall back to the system setting.
  }
  return "system";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;
  try {
    if (theme === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Not saved, but the theme still changes for this visit.
  }
}

// Light / Dark / System. "System" follows the computer's setting.
// The saved choice is also applied by a tiny script in index.html before the page draws,
// so the page never flashes in the wrong theme.
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(readTheme);

  function choose(next: Theme) {
    setTheme(next);
    applyTheme(next);
  }

  return (
    <div role="group" aria-label="Color theme" className="flex rounded-lg border border-rule bg-sunken p-0.5">
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            title={`${label} theme`}
            onClick={() => choose(value)}
            className={`flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-semibold transition
              focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-signal
              ${active ? "bg-panel text-ink shadow-sm" : "text-muted hover:text-ink"}`}
          >
            <Icon className="size-3.5" aria-hidden />
            <span className="hidden lg:inline">{label}</span>
            <span className="sr-only lg:hidden">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
