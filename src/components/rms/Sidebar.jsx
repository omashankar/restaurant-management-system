"use client";

import { adminPortalScope, adminShell, adminSurface } from "@/config/adminSurfaceClasses";
import SidebarBrand from "@/components/rms/SidebarBrand";
import { navForRole } from "@/config/navigation";
import { useApp } from "@/context/AppProviders";
import { useAccessControlSettings } from "@/hooks/useAccessControlSettings";
import { usePlatformConfig } from "@/hooks/usePlatformConfig";
import { useRestaurantBranding } from "@/hooks/useRestaurantBranding";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function Sidebar({
  collapsed = false,
  onCollapsedChange,
  onNavigate,
  allowCollapse = true,
  fullWidth = false,
  onClose,
}) {
  const { user } = useApp();
  const { name: brandName, sidebarLogoUrl: brandLogoUrl } = useRestaurantBranding();
  const accessControl = useAccessControlSettings();
  const { features: platformFeatures } = usePlatformConfig();
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState(() => ({
    menu:   pathname.startsWith("/menu"),
    tables: pathname.startsWith("/tables"),
  }));
  const [popover, setPopover] = useState(null);
  const closeTimerRef = useRef(null);
  const triggerRefs = useRef({});
  const popoverRef = useRef(null);
  const items = useMemo(
    () => (user ? navForRole(user.role, accessControl, platformFeatures) : []),
    [accessControl, platformFeatures, user]
  );
  const collapsedPopoverEnabled = collapsed && allowCollapse;
  const popoverItem = useMemo(() => {
    if (!popover?.id) return null;
    return items.find((item) => (item.href ?? item.id) === popover.id) ?? null;
  }, [items, popover]);

  useEffect(() => {
    if (pathname.startsWith("/menu")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpenGroups((g) => ({ ...g, menu: true }));
    }
    if (pathname.startsWith("/tables")) {
      setOpenGroups((g) => ({ ...g, tables: true }));
    }
  }, [pathname]);

  const toggleGroup = (id) => {
    setOpenGroups((g) => ({ ...g, [id]: !g[id] }));
  };

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openPopoverFor = (id) => {
    if (!collapsedPopoverEnabled) return;
    const trigger = triggerRefs.current[id];
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setPopover({
      id,
      top: rect.top + rect.height / 2,
      left: rect.right + 12,
    });
  };

  const scheduleClosePopover = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setPopover(null), 140);
  };

  const closePopoverNow = () => {
    clearCloseTimer();
    setPopover(null);
  };

  useEffect(() => {
    if (!collapsedPopoverEnabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPopover(null);
    }
  }, [collapsedPopoverEnabled]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!popover) return;
      const popNode = popoverRef.current;
      const triggerNode = triggerRefs.current[popover.id];
      if (popNode?.contains(event.target) || triggerNode?.contains(event.target)) return;
      setPopover(null);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setPopover(null);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [popover]);

  return (
    <aside
      className={`${adminShell.sidebar} h-full min-h-0 ${
        fullWidth ? "w-full" : collapsed ? "w-[72px]" : "w-64"
      }`}
    >
      <div className={`flex h-16 shrink-0 items-center justify-between gap-2 ${adminShell.borderB} px-3`}>
        <div className="min-w-0 flex-1">
          <SidebarBrand
            collapsed={collapsed && !fullWidth}
            name={brandName}
            logoUrl={brandLogoUrl}
          />
        </div>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className={`${adminSurface.btnIcon} shrink-0`}
            aria-label="Close menu"
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : allowCollapse ? (
          <button
            type="button"
            onClick={() => {
              const next = !collapsed;
              onCollapsedChange?.(next);
            }}
            className={`${adminSurface.sidebarToggle} group relative`}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </button>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-between">
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {items.map((item) => {
          if (item.type === "link") {
            const { href, label, Icon } = item;
            const active =
              pathname === href || pathname.startsWith(`${href}/`);
            const popId = href;
            return (
              <Link
                key={href}
                href={href}
                ref={(node) => {
                  triggerRefs.current[popId] = node;
                }}
                title={collapsed ? undefined : label}
                onClick={onNavigate}
                onMouseEnter={() => {
                  clearCloseTimer();
                  openPopoverFor(popId);
                }}
                onMouseLeave={scheduleClosePopover}
                onFocus={() => openPopoverFor(popId)}
                onBlur={scheduleClosePopover}
                onKeyDown={(event) => {
                  if (!collapsedPopoverEnabled) return;
                  if (
                    event.key === "ArrowRight" ||
                    event.key === "Enter" ||
                    event.key === " "
                  ) {
                    event.preventDefault();
                    openPopoverFor(popId);
                  }
                }}
                aria-label={collapsed ? label : undefined}
                className={`relative group flex rounded-xl text-sm font-medium transition-all duration-200 ${
                  collapsed
                    ? "size-11 items-center justify-center p-0"
                    : "w-full items-center gap-3 px-3 py-2.5"
                } ${
                  active
                    ? "bg-ra-primary-15 text-ra-primary ring-1 ring-ra-primary-25"
                    : adminSurface.navLink
                }`}
              >
                {active ? (
                  <span
                    className="absolute inset-y-1 left-0 w-0.5 rounded-r ra-nav-active-bar"
                    aria-hidden
                  />
                ) : null}
                <Icon
                  className={`size-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    active ? "text-ra-primary" : ""
                  }`}
                  aria-hidden
                />
                {!collapsed ? (
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="truncate">{label}</span>
                  </span>
                ) : (
                  <span className="sr-only">{label}</span>
                )}
              </Link>
            );
          }

          const { id, label, Icon, children } = item;
          const groupActive = pathname.startsWith(`/${id}`);
          const firstHref = children[0]?.href ?? `/${id}`;

          if (collapsed) {
            return (
              <Link
                key={id}
                href={firstHref}
                ref={(node) => {
                  triggerRefs.current[id] = node;
                }}
                title={undefined}
                onClick={(event) => {
                  onNavigate?.(event);
                  openPopoverFor(id);
                }}
                onMouseEnter={() => {
                  clearCloseTimer();
                  openPopoverFor(id);
                }}
                onMouseLeave={scheduleClosePopover}
                onFocus={() => openPopoverFor(id)}
                onBlur={scheduleClosePopover}
                onKeyDown={(event) => {
                  if (
                    event.key === "ArrowRight" ||
                    event.key === "Enter" ||
                    event.key === " "
                  ) {
                    event.preventDefault();
                    openPopoverFor(id);
                  }
                }}
                aria-label={label}
                className={`relative group flex size-11 items-center justify-center rounded-xl p-0 transition-all duration-200 ${
                  groupActive
                    ? "bg-ra-primary-15 text-ra-primary ring-1 ring-ra-primary-25"
                    : adminSurface.navLink
                }`}
              >
                {groupActive ? (
                  <span
                    className="absolute inset-y-1 left-0 w-0.5 rounded-r ra-nav-active-bar"
                    aria-hidden
                  />
                ) : null}
                <Icon
                  className={`size-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    groupActive ? "text-ra-primary" : ""
                  }`}
                  aria-hidden
                />
                <span className="sr-only">{label}</span>
              </Link>
            );
          }

          const open = openGroups[id] ?? false;

          return (
            <div key={id} className="space-y-0.5">
              <button
                type="button"
                onClick={() => toggleGroup(id)}
                className={adminSurface.navGroupBtn}
                data-active={groupActive ? "true" : "false"}
              >
                {groupActive ? (
                  <span
                    className="absolute inset-y-1 left-0 w-0.5 rounded-r ra-nav-active-bar"
                    aria-hidden
                  />
                ) : null}
                <Icon
                  className={`size-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    groupActive ? "text-ra-primary" : ""
                  }`}
                  aria-hidden
                />
                <span className="flex min-w-0 flex-1 items-center gap-2 truncate">
                  {label}
                </span>
                <ChevronDown
                  className={`size-4 shrink-0 admin-surface-muted transition-transform duration-200 ${
                    open ? "rotate-180" : ""
                  }`}
                  aria-hidden
                />
              </button>
              <div
                className={`ml-2 overflow-hidden border-l ${adminShell.borderR} pl-2 transition-[max-height,opacity] duration-300 ${
                  open ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="space-y-0.5 py-1">
                  {children.map((child) => {
                    const ChildIcon = child.Icon ?? Icon;
                    const active =
                      pathname === child.href ||
                      pathname.startsWith(`${child.href}/`);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onNavigate}
                        className={`group relative flex items-center gap-2 rounded-lg py-2 pl-2 pr-2 text-sm transition-all duration-200 ${
                          active
                            ? "bg-ra-primary-15 font-medium text-ra-primary"
                            : `${adminSurface.muted} hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]`
                        }`}
                      >
                        {active ? (
                          <span
                            className="absolute inset-y-1 left-0 w-0.5 rounded-r ra-nav-active-bar"
                            aria-hidden
                          />
                        ) : null}
                        <ChildIcon className="size-4 shrink-0 opacity-80 transition-transform duration-200 group-hover:scale-110" />
                        <span className="truncate">{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
        </nav>

        <div className={`border-t ${adminShell.borderT} p-2`}>
          <p
            className={`text-center text-xs ${adminSurface.muted} ${
              collapsed ? "px-0" : "px-2"
            }`}
            title={collapsed ? `${brandName} © ${new Date().getFullYear()}` : undefined}
          >
            {collapsed ? "©" : `${brandName} © ${new Date().getFullYear()}`}
          </p>
        </div>
      </div>
      {collapsedPopoverEnabled && popover && popoverItem
        ? createPortal(
            <div
              ref={popoverRef}
              className={`${adminPortalScope} ${adminSurface.dropdown} fixed z-[100] w-56 p-2 backdrop-blur-sm transition-all duration-150`}
              style={{
                left: popover.left,
                top: popover.top,
                transform: "translateY(-50%)",
              }}
              onMouseEnter={clearCloseTimer}
              onMouseLeave={scheduleClosePopover}
              role="menu"
              aria-label={`${popoverItem.label} menu`}
            >
              <p className={`px-2 py-1 text-xs font-semibold uppercase tracking-wide ${adminSurface.muted}`}>
                {popoverItem.label}
              </p>
              <div className="mt-1 space-y-0.5">
                {popoverItem.type === "group" ? (
                  popoverItem.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => closePopoverNow()}
                      className={adminSurface.menuItem}
                      role="menuitem"
                    >
                      {child.label}
                    </Link>
                  ))
                ) : (
                  <Link
                    href={popoverItem.href}
                    onClick={() => closePopoverNow()}
                    className="flex items-center rounded-lg px-2 py-2 text-sm admin-shell-text transition-colors hover:bg-[var(--admin-hover)]"
                    role="menuitem"
                  >
                    Open {popoverItem.label}
                  </Link>
                )}
              </div>
            </div>,
            document.body
          )
        : null}
    </aside>
  );
}
