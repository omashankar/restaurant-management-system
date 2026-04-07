"use client";

import TopDishes from "@/components/dashboard/TopDishes";
import StatsCard from "@/components/rms/StatsCard";
import { kitchenTickets } from "@/lib/mockData";
import { ChefHat, Clock, Flame, MonitorPlay } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const statusStyles = {
  new: {
    border: "border-l-amber-400",
    badge: "bg-amber-500/20 text-amber-200 ring-amber-500/30",
    label: "New",
  },
  preparing: {
    border: "border-l-sky-400",
    badge: "bg-sky-500/20 text-sky-200 ring-sky-500/30",
    label: "Preparing",
  },
  ready: {
    border: "border-l-emerald-400",
    badge: "bg-emerald-500/20 text-emerald-200 ring-emerald-500/30",
    label: "Ready",
  },
};

export default function ChefDashboard() {
  const [tickets, setTickets] = useState(kitchenTickets);

  const updateStatus = (id, status) =>
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));

  const newCount = tickets.filter((t) => t.status === "new").length;
  const prepCount = tickets.filter((t) => t.status === "preparing").length;
  const readyCount = tickets.filter((t) => t.status === "ready").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Kitchen View
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Incoming tickets and order queue.
          </p>
        </div>
        <Link
          href="/kitchen"
          className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:border-emerald-500/40"
        >
          <MonitorPlay className="size-4" />
          Full KDS
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard title="New" value={String(newCount)} subtitle="Awaiting start" icon={Flame} />
        <StatsCard title="Preparing" value={String(prepCount)} subtitle="In progress" icon={ChefHat} />
        <StatsCard title="Ready" value={String(readyCount)} subtitle="For pickup" icon={Clock} />
      </div>

      {/* Ticket queue */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-zinc-100">Live Queue</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {tickets.map((ticket) => {
            const tone = statusStyles[ticket.status] ?? statusStyles.new;
            return (
              <article
                key={ticket.id}
                className={`rounded-2xl border border-zinc-800 bg-zinc-900/70 border-l-4 ${tone.border}`}
              >
                <div className="flex items-start justify-between gap-2 border-b border-zinc-800/80 p-4">
                  <div>
                    <p className="font-mono text-sm text-emerald-400/90">{ticket.id}</p>
                    <p className="mt-1 text-lg font-semibold text-zinc-100">Table {ticket.table}</p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-zinc-500">
                      <Clock className="size-3.5" aria-hidden />
                      {ticket.placedAt}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ${tone.badge}`}>
                    {tone.label}
                  </span>
                </div>
                <ul className="space-y-2 p-4 text-sm text-zinc-300">
                  {ticket.items.map((it, idx) => (
                    <li key={idx} className="flex justify-between gap-2 rounded-lg bg-zinc-950/50 px-3 py-2">
                      <span>
                        <span className="font-semibold text-zinc-100">{it.qty}×</span> {it.name}
                        {it.note && <span className="mt-0.5 block text-xs text-amber-400/90">{it.note}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2 border-t border-zinc-800/80 p-4">
                  {ticket.status === "new" && (
                    <button
                      type="button"
                      onClick={() => updateStatus(ticket.id, "preparing")}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-500/20 px-3 py-2.5 text-sm font-semibold text-sky-200 ring-1 ring-sky-500/30 hover:bg-sky-500/30"
                    >
                      <Flame className="size-4" /> Start
                    </button>
                  )}
                  {ticket.status === "preparing" && (
                    <button
                      type="button"
                      onClick={() => updateStatus(ticket.id, "ready")}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
                    >
                      Mark Ready
                    </button>
                  )}
                  {ticket.status === "ready" && (
                    <button
                      type="button"
                      onClick={() => updateStatus(ticket.id, "new")}
                      className="flex-1 rounded-xl border border-zinc-700 py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-200"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Top dishes — no revenue shown */}
      <TopDishes />
    </div>
  );
}
