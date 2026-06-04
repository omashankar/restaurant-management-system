"use client";

import { adminSurface } from "@/config/adminSurfaceClasses";
import { useAdminColorMode } from "@/hooks/useAdminColorMode";
import { Moon, Sun } from "lucide-react";

/**
 * Header control — Sun = switch to light, Moon = switch to dark.
 * @param {"ra"|"sa"|"restaurant"|"super-admin"} [portal] — auto-detect from route if omitted
 */
export default function AdminColorModeToggle({ portal, className = "" }) {
  const { isLight, toggle } = useAdminColorMode(portal);

  return (
    <button
      type="button"
      onClick={toggle}
      className={`${adminSurface.btnIcon} ${className}`.trim()}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      title={isLight ? "Dark mode" : "Light mode"}
    >
      {isLight ? (
        <Moon className="size-4 shrink-0" aria-hidden />
      ) : (
        <Sun className="size-4 shrink-0" aria-hidden />
      )}
    </button>
  );
}
