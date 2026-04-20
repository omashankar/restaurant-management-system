"use client";

import { useUser } from "@/context/AuthContext";
import {
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const STORAGE_KEY = "sa-sidebar-collapsed";

const NAV = [
  { href: "/super-admin/dashboard",    label: "Dashboard",    Icon: LayoutDashboard },
  { href: "/super-admin/restaurants",  label: "Restaurants",  Icon: Building2       },
  { href: "/super-admin/users",        label: "Users",        Icon: Users           },
  { href: "/super-admin/plans",        label: "Plans",        Icon: CreditCard      },
  { href: "/super-admin/analytics",    label: "Analytics",    Icon: BarChart3       },
  { href: "/super-admin/settings",     label: "Settings",     Icon: Settings        },
  { href: "/super-admin/logs",         label: "Logs",         Icon: ClipboardList   },
];

export default function SuperAdminSidebar() {
  const { user, clearUser } = useUser();
  const pathname = usePathname();
  const router   = useRouter();

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

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    clearUser();
    router.push("/login");
  };

  return (
    <aside className={`relative flex h-full shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 transition-[width] duration-300 ease-out ${
      collapsed ? "w-[72px]" : "w-60"
    }`}>

      {/* ── Logo ── */}
      <div className="flex h-16 items-center justify-between gap-2 border-b border-zinc-800 px-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/25">
            <Shield className="size-5" />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight text-zinc-100">Super Admin</p>
              <p className="truncate text-[10px] text-zinc-500">RMS Control Panel</p>
            </div>
          )}
        </div>
        <button type="button" onClick={() => setCollapsed((v) => !v)}
          className="cursor-pointer flex shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 p-1.5 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-colors"
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
                  ? "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/25"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
              }`}>
              {active && (
                <span className="absolute inset-y-1 left-0 w-0.5 rounded-r bg-rose-400" aria-hidden />
              )}
              <Icon className={`size-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110 ${active ? "text-rose-400" : ""}`} aria-hidden />
              {!collapsed && <span className="truncate">{label}</span>}
              {collapsed && <span className="sr-only">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* ── User + Logout ── */}
      <div className="border-t border-zinc-800 p-2 space-y-1">
        {!collapsed && user && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2.5 mb-1">
            <p className="truncate text-xs font-semibold text-zinc-200">{user.name}</p>
            <p className="truncate text-[10px] text-zinc-600">{user.email}</p>
          </div>
        )}
        <button type="button" onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          className={`cursor-pointer group flex w-full rounded-xl text-sm font-medium text-zinc-400 transition-all hover:bg-red-500/10 hover:text-red-400 ${
            collapsed ? "size-11 items-center justify-center p-0" : "items-center gap-3 px-3 py-2.5"
          }`}>
          <LogOut className="size-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110" />
          {!collapsed && <span>Logout</span>}
          {collapsed && <span className="sr-only">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
