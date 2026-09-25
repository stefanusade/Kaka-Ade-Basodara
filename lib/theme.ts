/**
 * Preferensi tema: terang, gelap, atau mengikuti perangkat (system).
 *
 * `THEME_INIT_SCRIPT` disuntikkan di <head> dan dijalankan sebelum paint agar
 * tidak ada flash tema salah saat halaman dimuat. Kelas `dark` dipasang pada
 * <html> (Tailwind `darkMode: ["class"]`).
 */

export const THEME_STORAGE_KEY = "kab-theme";

/** Event internal untuk menyinkronkan semua instance ThemeToggle. */
export const THEME_EVENT = "kab-theme-change";

export type ThemePreference = "light" | "dark" | "system";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export const THEME_INIT_SCRIPT = `(function(){try{var k="${THEME_STORAGE_KEY}";var p=localStorage.getItem(k);if(p!=="light"&&p!=="dark"&&p!=="system"){p="system";}var d=p==="dark"||(p==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";r.dataset.theme=p;}catch(e){}})();`;

export function readStoredTheme(): ThemePreference {
  if (typeof window === "undefined") return "system";
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

export function resolveIsDark(preference: ThemePreference): boolean {
  if (preference === "dark") return true;
  if (preference === "light") return false;
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Terapkan tema ke <html>, simpan preferensi, lalu beri tahu instance lain. */
export function applyTheme(preference: ThemePreference): void {
  const root = document.documentElement;
  const isDark = resolveIsDark(preference);

  root.classList.toggle("dark", isDark);
  root.style.colorScheme = isDark ? "dark" : "light";
  root.dataset.theme = preference;

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // localStorage bisa diblokir (mode privat) — tema tetap berlaku untuk sesi ini
  }

  window.dispatchEvent(new Event(THEME_EVENT));
}
