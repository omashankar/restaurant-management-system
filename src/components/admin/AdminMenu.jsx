"use client";

import { adminShell, adminSurface } from "@/config/adminSurfaceClasses";
import Image from "next/image";

/** Floating profile / action menu panel */
export function AdminMenuPanel({
  children,
  className = "",
  align = "right",
  wide = false,
  visibilityClassName = "",
}) {
  const width = wide
    ? "w-[min(360px,calc(100vw-2rem))]"
    : "w-[min(240px,calc(100vw-2rem))]";
  const alignCls = align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left";

  return (
    <div
      className={`absolute ${alignCls} z-[60] mt-2 p-1.5 ${width} ${adminSurface.dropdown} transition-all duration-150 ${visibilityClassName} ${className}`}
      role="menu"
    >
      {children}
    </div>
  );
}

export function AdminMenuHeader({ title, subtitle }) {
  return (
    <div className="px-2.5 py-2">
      <p className={`truncate text-sm font-medium ${adminSurface.title}`}>{title}</p>
      {subtitle ? (
        <p className={`truncate text-xs ${adminSurface.muted}`}>{subtitle}</p>
      ) : null}
    </div>
  );
}

export function AdminMenuDivider() {
  return <div className={`my-1 h-px ${adminShell.divider}`} role="separator" />;
}

export function AdminMenuItem({
  children,
  onClick,
  icon: Icon,
  href,
  as: As = "button",
  className = "",
  danger = false,
}) {
  const base = `admin-surface-menu-item cursor-pointer ${danger ? "admin-surface-menu-item--danger" : ""} ${className}`;
  const inner = (
    <>
      {Icon ? <Icon className="admin-surface-menu-item-icon size-4 shrink-0" aria-hidden /> : null}
      {children}
    </>
  );

  if (href) {
    return (
      <a href={href} className={base} role="menuitem">
        {inner}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={base} role="menuitem">
      {inner}
    </button>
  );
}

/** Avatar trigger for header profile menus */
export function AdminAvatarButton({
  avatarSrc,
  fallback,
  onClick,
  open,
  label,
  ringClass = "ring-ra-primary-20",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`admin-avatar-trigger cursor-pointer inline-flex items-center justify-center rounded-full p-0.5 outline-none transition-colors focus-visible:ring-2 ${ringClass}`}
      aria-expanded={open}
      aria-haspopup="menu"
      aria-label={label}
    >
      {avatarSrc ? (
        <Image
          src={avatarSrc}
          alt=""
          width={36}
          height={36}
          className="size-9 rounded-full object-cover ring-1 admin-shell-border"
          unoptimized
        />
      ) : (
        <span className="admin-avatar-fallback flex size-9 items-center justify-center rounded-full text-sm font-semibold">
          {fallback}
        </span>
      )}
    </button>
  );
}
