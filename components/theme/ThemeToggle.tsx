"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { THEME_EVENT, applyTheme, readStoredTheme, type ThemePreference } from "@/lib/theme";

const OPTIONS: { value: ThemePreference; label: string; Icon: LucideIcon }[] = [
  { value: "light", label: "Mode terang", Icon: Sun },
  { value: "dark", label: "Mode gelap", Icon: Moon },
  { value: "system", label: "Ikuti perangkat", Icon: Monitor },
];

/**
 * Pemilih tema terang / gelap / perangkat.
 *
 * Dipakai di header (dan panel mobile) yang selalu berlatar gelap, jadi
 * warnanya sengaja tidak mengikuti tema. `theme` bernilai null sampai mount
 * supaya markup server dan klien identik (tidak ada hydration mismatch).
 */
export default function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<ThemePreference | null>(null);

  useEffect(() => {
    setTheme(readStoredTheme());

    const syncFromStorage = () => setTheme(readStoredTheme());
    window.addEventListener(THEME_EVENT, syncFromStorage);

    // Saat mode "perangkat", ikuti perubahan preferensi OS secara live
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      if (readStoredTheme() === "system") applyTheme("system");
    };
    media.addEventListener("change", handleSystemChange);

    return () => {
      window.removeEventListener(THEME_EVENT, syncFromStorage);
      media.removeEventListener("change", handleSystemChange);
    };
  }, []);

  return (
    <div
      role="group"
      aria-label="Tema tampilan"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-white/15 bg-white/5 p-0.5",
        className
      )}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = theme === value;

        return (
          <button
            key={value}
            type="button"
            onClick={() => {
              setTheme(value);
              applyTheme(value);
            }}
            aria-pressed={active}
            title={label}
            className={cn(
              "rounded-full p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
              active ? "bg-white/15 text-white" : "text-slate-400 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
