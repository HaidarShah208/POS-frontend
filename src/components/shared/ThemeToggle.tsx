"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTheme, type Theme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { Sun, Moon, Monitor } from "lucide-react";

const THEMES: { id: Theme; label: string; icon: React.ReactNode }[] = [
  { id: "light", label: "Light", icon: <Sun className="h-4 w-4" /> },
  { id: "dark", label: "Dark", icon: <Moon className="h-4 w-4" /> },
  { id: "system", label: "System", icon: <Monitor className="h-4 w-4" /> },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const currentIcon = THEMES.find((t) => t.id === theme)?.icon ?? <Sun className="h-4 w-4" />;

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setOpen(!open)} aria-label="Toggle theme">
        {currentIcon}
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-36 rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-lg)] py-1 z-50">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={cn(
                "flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors",
                theme === t.id ? "bg-[var(--muted)] font-medium" : "hover:bg-[var(--muted)]"
              )}
              onClick={() => { setTheme(t.id); setOpen(false); }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
