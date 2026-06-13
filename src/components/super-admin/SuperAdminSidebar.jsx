"use client";

import SidebarBrand from "@/components/rms/SidebarBrand";
import { usePlatformConfig } from "@/hooks/usePlatformConfig";
import { resolveSuperAdminSidebarBranding } from "@/lib/resolveBrandLogos";
import {
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Globe,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  Receipt,
  Settings,
  X,
} from "lucide-react";
import { adminPortalScope, adminShell, adminSurface } from "@/config/adminSurfaceClasses";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const STORAGE_KEY = "sa-sidebar-collapsed";

const NAV = [
  { href: "/super-admin/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/super-admin/restaurants", label: "Restaurants", Icon: Building2 },
  { href: "/super-admin/payments", label: "Subscription Payments", Icon: Receipt },
  { href: "/super-admin/plans", label: "Plans", Icon: CreditCard },
  { href: "/super-admin/billing", label: "Billing", Icon: Receipt },
  { href: "/super-admin/analytics", label: "Analytics", Icon: BarChart3 },
  { href: "/super-admin/landing-site", label: "Landing Site", Icon: Globe },
  { href: "/super-admin/contact-inbox", label: "Contact Inbox", Icon: Inbox, badgeKey: "contact" },
  { href: "/super-admin/logs", label: "Logs", Icon: ClipboardList },
  { href: "/super-admin/support-tickets", label: "Support Tickets", Icon: LifeBuoy },
  { href: "/super-admin/settings", label: "Settings", Icon: Settings },
];

export default function SuperAdminSidebar({ mobile = false, onNavigate, onClose }) {
  const { config } = usePlatformConfig();
  const branding = useMemo(
    () => resolveSuperAdminSidebarBranding({
      appName: config.appName,
      logoUrl: config.logoUrl,
    }),
    [config.appName, config.logoUrl],
  );
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [contactNewCount, setContactNewCount] = useState(0);
  const [popover, setPopover] = useState(null);
  const closeTimerRef = useRef(null);
  const triggerRefs = useRef({});
  const popoverRef = useRef(null);

  const showCollapsed = mobile ? false : collapsed;
  const collapsedPopoverEnabled = showCollapsed && !mobile;

  const navItems = useMemo(
    () =>
      NAV.map((item) => ({
        type: "link",
        href: item.href,
        label: item.label,
        Icon: item.Icon,
        badgeKey: item.badgeKey,
      })),
    []
  );

  const popoverItem = useMemo(() => {
    if (!popover?.id) return null;
    return navItems.find((item) => item.href === popover.id) ?? null;
  }, [navItems, popover]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/super-admin/contact-messages?stats=1");
        const data = await res.json();
        if (!cancelled && res.ok && data?.success) {
          setContactNewCount(Number(data.stats?.new ?? 0));
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      /* ignore */
    }
  }, [collapsed]);

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

  const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside
      className={`${adminShell.sidebar} flex h-full min-h-0 flex-col ${
        mobile ? "w-full" : showCollapsed ? "w-[72px]" : "w-64"
      }`}
    >
      <div className={`flex h-16 shrink-0 items-center justify-between gap-2 ${adminShell.borderB} px-3`}>
        <div className="min-w-0 flex-1">
          <SidebarBrand
            collapsed={showCollapsed && !mobile}
            name={branding.name}
            logoUrl={branding.sidebarLogoUrl}
            portal="super-admin"
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
        ) : !mobile ? (
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className={`${adminSurface.sidebarToggle} shrink-0`}
            aria-expanded={!showCollapsed}
            aria-label={showCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {showCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-between">
        <nav className="flex-1 space-y-0.5 overflow-y-auto overscroll-y-contain p-2 [-webkit-overflow-scrolling:touch]">
          {navItems.map(({ href, label, Icon, badgeKey }) => {
            const active = isActive(href);
            const badge = badgeKey === "contact" ? contactNewCount : 0;

            return (
              <Link
                key={href}
                href={href}
                ref={(node) => {
                  triggerRefs.current[href] = node;
                }}
                onClick={() => {
                  onNavigate?.();
                  closePopoverNow();
                }}
                onMouseEnter={() => {
                  clearCloseTimer();
                  openPopoverFor(href);
                }}
                onMouseLeave={scheduleClosePopover}
                onFocus={() => openPopoverFor(href)}
                onBlur={scheduleClosePopover}
                onKeyDown={(event) => {
                  if (!collapsedPopoverEnabled) return;
                  if (event.key === "ArrowRight" || event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openPopoverFor(href);
                  }
                }}
                aria-label={showCollapsed ? label : undefined}
                className={`relative group flex rounded-xl text-sm font-medium transition-all duration-200 ${
                  showCollapsed
                    ? "size-11 items-center justify-center p-0"
                    : "w-full items-center gap-3 px-3 py-2.5"
                } ${
                  active
                    ? "bg-sa-primary-15 text-sa-primary ring-1 ring-sa-primary-25"
                    : adminSurface.navLink
                }`}
              >
                {active ? (
                  <span className="absolute inset-y-1 left-0 w-0.5 rounded-r sa-nav-active-bar" aria-hidden />
                ) : null}
                <Icon
                  className={`size-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    active ? "text-sa-primary" : ""
                  }`}
                  aria-hidden
                />
                {!showCollapsed ? (
                  <span className={mobile ? "min-w-0 break-words leading-snug" : "truncate"}>{label}</span>
                ) : (
                  <span className="sr-only">{label}</span>
                )}
                {badge > 0 ? (
                  <span
                    className={`${
                      showCollapsed ? "absolute -right-0.5 -top-0.5" : "ml-auto"
                    } flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white`}
                  >
                    {badge > 99 ? "99+" : badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className={`border-t ${adminShell.borderT} p-2`}>
          <p
            className={`text-center text-xs ${adminSurface.muted} ${showCollapsed ? "px-0" : "px-2"}`}
            title={showCollapsed ? `${branding.name} © ${new Date().getFullYear()}` : undefined}
          >
            {showCollapsed ? "©" : `${branding.name} © ${new Date().getFullYear()}`}
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
                <Link
                  href={popoverItem.href}
                  onClick={() => {
                    closePopoverNow();
                    onNavigate?.();
                  }}
                  className="flex items-center rounded-lg px-2 py-2 text-sm admin-shell-text transition-colors hover:bg-[var(--admin-hover)]"
                  role="menuitem"
                >
                  Open {popoverItem.label}
                </Link>
              </div>
            </div>,
            document.body
          )
        : null}
    </aside>
  );
}
