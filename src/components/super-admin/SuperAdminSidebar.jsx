"use client";

import {
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Globe,
  LayoutDashboard,
  LifeBuoy,
  Receipt,
  Settings,
  Shield,
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
  { href: "/super-admin/logs",          label: "Logs",          Icon: ClipboardList   },
  { href: "/super-admin/support-tickets", label: "Support Tickets", Icon: LifeBuoy    },
  { href: "/super-admin/settings",      label: "Settings",      Icon: Settings        },
];

export default function SuperAdminSidebar() {
  const pathname = usePathname();

  /* ── Persistent collapsed state ── */
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw === "true";
    } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, String(collapsed)); }
    catch { /* ignore */ }
  }, [collapsed]);

  const isActive = (href) => pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className={`${adminShell.sidebar} ${
      collapsed ? "w-[72px]" : "w-60"
    }`}>

      {/* ── Logo ── */}
      <div className={`flex h-16 items-center justify-between gap-2 ${adminShell.borderB} px-3`}>
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sa-primary-15 text-sa-primary ring-1 ring-sa-primary-25">
            <Shield className="size-5" />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className={`truncate text-sm font-bold tracking-tight ${adminSurface.title}`}>Super Admin</p>
              <p className={`truncate text-[10px] ${adminSurface.muted}`}>RMS Control Panel</p>
            </div>
          )}
        </div>
        <button type="button" onClick={() => setCollapsed((v) => !v)}
          className={adminSurface.sidebarToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </div>

      {/* ── Nav items ── */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {NAV.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href}
              title={collapsed ? label : undefined}
              className={`relative group flex rounded-xl text-sm font-medium transition-all duration-200 ${
                collapsed
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
              {!collapsed && <span className="truncate">{label}</span>}
              {collapsed && <span className="sr-only">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="border-t admin-shell-border p-2">
        <p
          className={`text-center text-xs admin-surface-muted ${collapsed ? "px-0" : "px-2"}`}
          title={collapsed ? "RMS © 2026" : undefined}
        >
          {collapsed ? "©" : "RMS © 2026"}
        </p>
      </div>
    </aside>
  );
}
