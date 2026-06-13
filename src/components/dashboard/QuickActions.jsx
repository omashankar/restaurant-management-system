"use client";



import { usePermission } from "@/hooks/usePermission";

import {

  BarChart3,

  ShoppingCart,

  Table2,

  UtensilsCrossed,

} from "lucide-react";

import { adminSurface } from "@/config/adminSurfaceClasses";

import Link from "next/link";



const ALL_ACTIONS = [

  {

    href: "/pos",

    label: "New Order",

    sub: "Open POS terminal",

    Icon: ShoppingCart,

    accent: "emerald",

    permission: "manage_orders",

  },

  {

    href: "/menu/items",

    label: "Add Menu Item",

    sub: "Update catalog",

    Icon: UtensilsCrossed,

    accent: "indigo",

    permission: "manage_menu",

  },

  {

    href: "/analytics",

    label: "View Reports",

    sub: "Sales & analytics",

    Icon: BarChart3,

    accent: "sky",

    permission: "view_analytics",

  },

  {

    href: "/tables",

    label: "Manage Tables",

    sub: "Floor layout",

    Icon: Table2,

    accent: "amber",

    permission: "manage_tables",

  },

];



const accentMap = {

  emerald: { icon: "bg-ra-primary-15 text-ra-primary ring-ra-primary-20", hover: "hover-border-ra-primary-40 hover:bg-ra-primary-5" },

  indigo:  { icon: "bg-indigo-500/15 text-indigo-400 ring-indigo-500/20",   hover: "hover:border-indigo-500/40 hover:bg-indigo-500/5" },

  sky:     { icon: "bg-sky-500/15 text-sky-400 ring-sky-500/20",             hover: "hover:border-sky-500/40 hover:bg-sky-500/5" },

  amber:   { icon: "bg-amber-500/15 text-amber-400 ring-amber-500/20",       hover: "hover:border-amber-500/40 hover:bg-amber-500/5" },

  violet:  { icon: "bg-violet-500/15 text-violet-400 ring-violet-500/20",    hover: "hover:border-violet-500/40 hover:bg-violet-500/5" },

};



export default function QuickActions({ compact = false }) {

  const { hasPermission } = usePermission();

  const visible = ALL_ACTIONS.filter((a) => hasPermission(a.permission));



  const gridCls = compact

    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-1"

    : "grid-cols-1 sm:grid-cols-2";



  return (

    <div className="rms-dashboard-card rms-dashboard-card--lg flex h-full min-h-0 w-full min-w-0 flex-col p-4 sm:p-5 admin-surface-card">

      <div className="shrink-0">

        <h3 className="admin-surface-title break-words text-sm font-semibold">Quick Actions</h3>

        <p className="mt-0.5 admin-surface-subheading break-words">Shortcuts for common tasks</p>

      </div>

      <div className="rms-dashboard-card__body rms-dashboard-card__body--y mt-3 min-h-0 flex-1 pr-1 sm:mt-4">

      <div className={`grid min-w-0 gap-2 ${gridCls}`}>

        {visible.map(({ href, label, sub, Icon, accent }) => {

          const a = accentMap[accent];

          const horizontal = compact;

          return (

            <Link

              key={href}

              href={href}

              className={`group flex min-w-0 rounded-xl border admin-shell-border bg-[var(--admin-hover)] transition-all duration-200 ${a.hover} ${

                horizontal

                  ? "flex-row items-center gap-3 p-3"

                  : "flex-col gap-3 p-3.5"

              }`}

            >

              <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 transition-transform duration-200 group-hover:scale-105 ${a.icon}`}>

                <Icon className="size-4" aria-hidden />

              </span>

              <div className="min-w-0 flex-1">

                <p className="break-words text-sm font-semibold admin-shell-text">{label}</p>

                <p className={`break-words text-xs ${adminSurface.muted}`}>{sub}</p>

              </div>

            </Link>

          );

        })}

      </div>

      </div>

    </div>

  );

}


