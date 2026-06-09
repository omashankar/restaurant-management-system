"use client";

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
  Shield,
  X,
} from "lucide-react";
import { adminShell, adminSurface } from "@/config/adminSurfaceClasses";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const STORAGE_KEY = "sa-sidebar-collapsed";

const NAV = [
  { href: "/super-admin/dashboard",     label: "Dashboard",     Icon: LayoutDashboard },
  { href: "/super-admin/restaurants",   label: "Restaurants",   Icon: Building2       },
  { href: "/super-admin/payments",      label: "Subscription Payments", Icon: Receipt  },
  { href: "/super-admin/plans",         label: "Plans",         Icon: CreditCard      },
  { href: "/super-admin/billing",       label: "Billing",       Icon: Receipt         },
  { href: "/super-admin/analytics",     label: "Analytics",     Icon: BarChart3       },
  { href: "/super-admin/landing-site",  label: "Landing Site",  Icon: Globe           },
  { href: "/super-admin/contact-inbox", label: "Contact Inbox", Icon: Inbox, badgeKey: "contact" },
  { href: "/super-admin/logs",          label: "Logs",          Icon: ClipboardList   },
  { href: "/super-admin/support-tickets", label: "Support Tickets", Icon: LifeBuoy    },
  { href: "/super-admin/settings",      label: "Settings",      Icon: Settings        },
];

export default function SuperAdminSidebar({ mobile = false, onNavigate, onClose }) {
  const pathname = usePathname();

  /* ── Persistent collapsed state ── */
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw === "true";
    } catch { return false; }
  });
  const [contactNewCount, setContactNewCount] = useState(0);

  const showCollapsed = mobile ? false : collapsed;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/super-admin/contact-messages?stats=1");
        const data = await res.json();
        if (!cancelled && res.ok && data?.success) {
          setContactNewCount(Number(data.stats?.new ?? 0));
        }
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [pathname]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, String(collapsed)); }
    catch { /* ignore */ }
  }, [collapsed]);

  const isActive = (href) => pathname === href || pathname.startsWith(href + "/");

  return (
    <aside
      className={`${adminShell.sidebar} h-full min-h-0 ${
        mobile ? "w-full" : showCollapsed ? "w-[72px]" : "w-60"
      }`}
    >

      {/* ── Logo ── */}
      <div className={`flex h-16 items-center justify-between gap-2 ${adminShell.borderB} px-3`}>
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sa-primary-15 text-sa-primary ring-1 ring-sa-primary-25">
            <Shield className="size-5" />
          </span>
          {!showCollapsed && (
            <div className="min-w-0">
              <p className={`truncate text-sm font-bold tracking-tight ${adminSurface.title}`}>Super Admin</p>
              <p className={`truncate text-[10px] ${adminSurface.muted}`}>RMS Control Panel</p>
            </div>
          )}
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
            className={adminSurface.sidebarToggle}
            aria-label={showCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {showCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        ) : null}
      </div>

      {/* ── Nav items ── */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {NAV.map(({ href, label, Icon, badgeKey }) => {
          const active = isActive(href);
          const badge = badgeKey === "contact" ? contactNewCount : 0;
          return (
            <Link key={href} href={href}
              onClick={() => onNavigate?.()}
              title={showCollapsed ? label : undefined}
              className={`relative group flex rounded-xl text-sm font-medium transition-all duration-200 ${
                showCollapsed
                  ? "size-11 items-center justify-center p-0"
                  : "w-full items-center gap-3 px-3 py-2.5"
              } ${
                active
                  ? "bg-sa-primary-15 text-sa-primary-muted ring-1 ring-sa-primary-25"
                  : adminSurface.navLink
              }`}>
              {active && (
                <span className="absolute inset-y-1 left-0 w-0.5 rounded-r sa-nav-active-bar" aria-hidden />
              )}
              <Icon className={`size-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110 ${active ? "text-sa-primary" : ""}`} aria-hidden />
              {!showCollapsed && <span className="truncate">{label}</span>}
              {badge > 0 && (
                <span className={`${showCollapsed ? "absolute -right-0.5 -top-0.5" : "ml-auto"} flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white`}>
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
              {showCollapsed && <span className="sr-only">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="border-t admin-shell-border p-2">
        <p
          className={`text-center text-xs admin-surface-muted ${showCollapsed ? "px-0" : "px-2"}`}
          title={showCollapsed ? "RMS © 2026" : undefined}
        >
          {showCollapsed ? "©" : "RMS © 2026"}
        </p>
      </div>
    </aside>
  );
}
