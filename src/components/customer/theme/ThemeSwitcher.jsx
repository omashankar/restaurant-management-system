"use client";

import { useCustomerTheme } from "@/context/CustomerThemeContext";
import { Moon, Sun } from "lucide-react";

/**
 * Light / dark mode — single icon shows the mode you can switch to.
 */
export default function ThemeSwitcher({ className = "" }) {
  const { toggleMode, isDark } = useCustomerTheme();

  return (
    <button
      type="button"
      onClick={toggleMode}
      className={`ct-theme-switch flex size-11 min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-center rounded-full text-[var(--customer-nav-muted)] transition-colors hover:bg-[var(--customer-primary-soft)] hover:text-[var(--customer-nav-text)] ${className}`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
    </button>
  );
}
