"use client";

import DataTableShell from "@/components/ui/DataTableShell";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { useModuleData } from "@/context/ModuleDataContext";
import { ArrowLeft, Mail, Phone, StickyNote } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function CustomerDetailPage() {
  const params = useParams();
  const raw = params?.id;
  const id = Array.isArray(raw) ? raw[0] : raw ?? "";
  const { hydrated, customerRows } = useModuleData();
  const [loading, setLoading] = useState(true);
  const customer = customerRows.find((c) => c.id === id);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, [hydrated]);

  if (!hydrated || loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 rounded-lg bg-zinc-800 animate-pulse" />
        <TableSkeleton rows={4} cols={4} />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-10 text-center">
        <p className="text-zinc-400">Customer not found.</p>
        <Link
          href="/customers"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-400 hover:text-emerald-300"
        >
          <ArrowLeft className="size-4" />
          Back to customers
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link
        href="/customers"
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-emerald-400"
      >
        <ArrowLeft className="size-4" />
        Customers
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          {customer.name}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">Guest profile · mock data</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition-colors hover:border-zinc-700">
          <div className="flex items-center gap-2 text-zinc-500">
            <Phone className="size-4 text-emerald-500/80" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Phone
            </span>
          </div>
          <p className="mt-2 tabular-nums text-zinc-100">{customer.phone}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition-colors hover:border-zinc-700">
          <div className="flex items-center gap-2 text-zinc-500">
            <Mail className="size-4 text-emerald-500/80" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Email
            </span>
          </div>
          <p className="mt-2 truncate text-zinc-100">{customer.email}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:col-span-2">
          <div className="flex items-center gap-2 text-zinc-500">
            <StickyNote className="size-4 text-emerald-500/80" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Notes
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">
            {customer.notes || "No notes on file."}
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-zinc-100">Order history</h2>
        <p className="mt-1 text-sm text-zinc-500">
          {customer.visits} lifetime visits · last visit{" "}
          {customer.lastVisit}
        </p>
        <DataTableShell className="mt-4">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Summary</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {customer.orderHistory?.length ? (
                customer.orderHistory.map((o) => (
                  <tr
                    key={o.id}
                    className="transition-colors hover:bg-zinc-800/30"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-emerald-400/90">
                      {o.id}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{o.date}</td>
                    <td className="px-4 py-3 text-zinc-300">{o.items}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-zinc-100">
                      ${o.total.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-sm text-zinc-500"
                  >
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </DataTableShell>
      </div>
    </div>
  );
}
