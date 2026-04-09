"use client";

import OrderCard from "@/components/rms/OrderCard";
import { recentOrders } from "@/lib/mockData";
import { Filter } from "lucide-react";
import { useState } from "react";

export default function OrdersPage() {
  const [filter, setFilter] = useState("all");
  const list =
    filter === "all"
      ? recentOrders
      : recentOrders.filter((o) => o.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Orders
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Live ticket rail · mock dataset
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
            <Filter className="size-3.5" aria-hidden />
            Status
          </span>
          {["all", "new", "preparing", "ready", "completed"].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold capitalize transition-all duration-200 ${
                filter === f
                  ? "bg-emerald-500 text-zinc-950"
                  : "bg-zinc-900 text-zinc-400 ring-1 ring-zinc-800 hover:text-zinc-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {list.map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}
      </div>
    </div>
  );
}
