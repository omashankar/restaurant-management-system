"use client";

import { adminSurface } from "@/config/adminSurfaceClasses";

/**
 * Vertical section nav (Landing Site, Settings tabs) — full-width items inside a card track.
 */
export function AdminSideNav({ children, className = "" }) {
  return (
    <aside
      className={`admin-side-nav shrink-0 ${adminSurface.cardSolid} ${className}`}
    >
      {children}
    </aside>
  );
}

export function AdminSideNavList({ children, className = "" }) {
  return (
    <nav
      className={`admin-side-nav-list flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0 ${className}`}
    >
      {children}
    </nav>
  );
}

export function AdminSideNavItem({
  active,
  onClick,
  children,
  icon: Icon,
  className = "",
  activeClassName = "",
}) {
  const useCustomActive = Boolean(active && activeClassName);
  const isSolidBrandFill =
    useCustomActive &&
    /(?:^|\s)bg-(?:sa|ra)-primary(?:\s|$)/.test(activeClassName);
  const usesActivePill =
    useCustomActive && activeClassName.includes("admin-side-nav-active-pill");
  const activeIconCls = isSolidBrandFill
    ? "text-zinc-950"
    : usesActivePill
      ? "admin-side-nav-brand-icon"
      : active
        ? "text-sa-primary"
        : "admin-surface-faint";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`admin-side-nav-item cursor-pointer flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors whitespace-nowrap lg:w-full ${
        active && !useCustomActive ? "admin-side-nav-item--active" : ""
      } ${active ? activeClassName : ""} ${className}`}
    >
      {Icon ? (
        <Icon
          className={`size-4 shrink-0 ${activeIconCls}`}
          aria-hidden
        />
      ) : null}
      <span className="truncate">{children}</span>
    </button>
  );
}
