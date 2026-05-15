"use client";

import { usePermission } from "@/hooks/usePermission";
import {
  BarChart3,
  ShoppingCart,
  Table2,
  UtensilsCrossed,
} from "lucide-react";
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
  emerald: { icon: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/20", hover: "hover:border-emerald-500/40 hover:bg-emerald-500/5" },
  indigo:  { icon: "bg-indigo-500/15 text-indigo-400 ring-indigo-500/20",   hover: "hover:border-indigo-500/40 hover:bg-indigo-500/5" },
  sky:     { icon: "bg-sky-500/15 text-sky-400 ring-sky-500/20",             hover: "hover:border-sky-500/40 hover:bg-sky-500/5" },
  amber:   { icon: "bg-amber-500/15 text-amber-400 ring-amber-500/20",       hover: "hover:border-amber-500/40 hover:bg-amber-500/5" },
  violet:  { icon: "bg-violet-500/15 text-violet-400 ring-violet-500/20",    hover: "hover:border-violet-500/40 hover:bg-violet-500/5" },
};

export default function QuickActions() {
  const { hasPermission } = usePermission();
  const visible = ALL_ACTIONS.filter((a) => hasPermission(a.permission));

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <h3 className="text-sm font-semibold text-zinc-100">Quick Actions</h3>
      <p className="mt-0.5 text-xs text-zinc-500">Shortcuts for common tasks</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {visible.map(({ href, label, sub, Icon, accent }) => {
          const a = accentMap[accent];
          return (
            <Link
              key={href}
              href={href}
              className={`group flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3.5 transition-all duration-200 ${a.hover}`}
            >
              <span className={`flex size-9 items-center justify-center rounded-lg ring-1 transition-transform duration-200 group-hover:scale-105 ${a.icon}`}>
                <Icon className="size-4" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-zinc-200">{label}</p>
                <p className="text-xs text-zinc-600">{sub}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
