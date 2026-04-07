"use client";

import { navForRole } from "@/config/navigation";
import { useApp } from "@/context/AppProviders";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
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
}) {
  const { user } = useApp();
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState(() => ({
    menu: pathname.startsWith("/menu"),
  }));
  const [popover, setPopover] = useState(null);
  const closeTimerRef = useRef(null);
  const triggerRefs = useRef({});
  const popoverRef = useRef(null);
  const items = user ? navForRole(user.role) : [];
  const collapsedPopoverEnabled = collapsed && allowCollapse;
  const popoverItem = useMemo(() => {
    if (!popover?.id) return null;
    return items.find((item) => (item.href ?? item.id) === popover.id) ?? null;
  }, [items, popover]);

  useEffect(() => {
    if (pathname.startsWith("/menu")) {
      setOpenGroups((g) => ({ ...g, menu: true }));
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
    if (!collapsedPopoverEnabled) setPopover(null);
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
      className={`relative flex h-full shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 transition-[width] duration-300 ease-out ${
        collapsed ? "w-[72px]" : "w-64"
      }`}
    >
      <div className="flex h-16 items-center justify-between gap-2 border-b border-zinc-800 px-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
            <UtensilsCrossed className="size-5" aria-hidden />
          </span>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-zinc-100">
                RMS
              </p>
              <p className="truncate text-[11px] text-zinc-500">Restaurant OS</p>
            </div>
          ) : null}
        </div>

        {allowCollapse ? (
          <button
            type="button"
            onClick={() => {
              const next = !collapsed;
              onCollapsedChange?.(next);
            }}
            className="cursor-pointer group relative inline-flex shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 p-1.5 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
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
                    ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                }`}
              >
                {active ? (
                  <span
                    className="absolute inset-y-1 left-0 w-0.5 rounded-r bg-emerald-400"
                    aria-hidden
                  />
                ) : null}
                <Icon
                  className={`size-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    active ? "text-emerald-400" : ""
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
          const groupActive = pathname.startsWith("/menu");
          const firstHref = children[0]?.href ?? "/menu/items";

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
                    ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                }`}
              >
                {groupActive ? (
                  <span
                    className="absolute inset-y-1 left-0 w-0.5 rounded-r bg-emerald-400"
                    aria-hidden
                  />
                ) : null}
                <Icon
                  className={`size-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    groupActive ? "text-emerald-400" : ""
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
                className={`cursor-pointer relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                  groupActive
                    ? "bg-zinc-900 text-zinc-100 ring-1 ring-zinc-800"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                }`}
              >
                {groupActive ? (
                  <span
                    className="absolute inset-y-1 left-0 w-0.5 rounded-r bg-emerald-400"
                    aria-hidden
                  />
                ) : null}
                <Icon
                  className={`size-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    groupActive ? "text-emerald-400" : ""
                  }`}
                  aria-hidden
                />
                <span className="flex min-w-0 flex-1 items-center gap-2 truncate">
                  {label}
                </span>
                <ChevronDown
                  className={`size-4 shrink-0 text-zinc-500 transition-transform duration-200 ${
                    open ? "rotate-180" : ""
                  }`}
                  aria-hidden
                />
              </button>
              <div
                className={`ml-2 overflow-hidden border-l border-zinc-800 pl-2 transition-[max-height,opacity] duration-300 ${
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
                            ? "bg-emerald-500/15 font-medium text-emerald-300"
                            : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
                        }`}
                      >
                        {active ? (
                          <span
                            className="absolute inset-y-1 left-0 w-0.5 rounded-r bg-emerald-400"
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

        <div className="border-t border-zinc-800 p-2">
          <p
            className={`text-center text-xs text-zinc-500 ${
              collapsed ? "px-0" : "px-2"
            }`}
            title={collapsed ? "RMS © 2026" : undefined}
          >
            {collapsed ? "©" : "RMS © 2026"}
          </p>
        </div>
      </div>
      {collapsedPopoverEnabled && popover && popoverItem
        ? createPortal(
            <div
              ref={popoverRef}
              className="fixed z-[100] w-56 rounded-xl border border-zinc-800 bg-zinc-900/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-sm transition-all duration-150"
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
              <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {popoverItem.label}
              </p>
              <div className="mt-1 space-y-0.5">
                {popoverItem.type === "group" ? (
                  popoverItem.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => closePopoverNow()}
                      className="flex items-center rounded-lg px-2 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-800"
                      role="menuitem"
                    >
                      {child.label}
                    </Link>
                  ))
                ) : (
                  <Link
                    href={popoverItem.href}
                    onClick={() => closePopoverNow()}
                    className="flex items-center rounded-lg px-2 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-800"
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
