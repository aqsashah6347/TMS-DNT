import { Sun, Moon } from "lucide-react";
import { useThemeStore } from "../../store/useThemeStore";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/40 transition-colors"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <Sun size={17} className="text-dark/70" /> : <Moon size={17} className="text-dark/70" />}
    </button>
  );
}