import { create } from "zustand";

function getInitialTheme() {
  const saved = localStorage.getItem("tms_theme");
  if (saved) return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("tms_theme", theme);
}

const initial = getInitialTheme();
applyTheme(initial); // apply immediately on load, before React even renders

export const useThemeStore = create((set, get) => ({
  theme: initial,

  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    applyTheme(next);
    set({ theme: next });
  },
}));