"use client";

import { useCustomerTheme } from "@/context/CustomerThemeContext";
import { Moon, Sun } from "lucide-react";

/**
 * Light / dark mode toggle — persists per restaurant in localStorage.
 */
export default function ThemeSwitcher({
  className = "",
  showLabel = true,
  size = "sm",
}) {
  const { mode, toggleMode, isDark } = useCustomerTheme();
  const iconCls = size === "md" ? "size-4" : "size-3.5";
  const pad = size === "md" ? "px-3 py-2" : "px-2 py-1.5";

  return (
    <button
      type="button"
      onClick={toggleMode}
      className={`ct-theme-switch inline-flex cursor-pointer items-center gap-1.5 rounded-lg transition-colors ${pad} ${className}`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? (
        <Sun className={iconCls} style={{ color: "var(--customer-primary)" }} />
      ) : (
        <Moon className={iconCls} style={{ color: "var(--customer-nav-muted)" }} />
      )}
      {showLabel && (
        <span className="text-xs font-medium" style={{ color: "var(--customer-nav-text)" }}>
          {isDark ? "Light" : "Dark"}
        </span>
      )}
    </button>
  );
}
