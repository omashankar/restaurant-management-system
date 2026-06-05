"use client";

import CustomerOrderHistoryTable from "@/components/customers/CustomerOrderHistoryTable";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { useModuleData } from "@/context/ModuleDataContext";
import { ArrowLeft, Mail, Phone, StickyNote } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

function normalizeCustomer(row) {
  return {
    id: row.id,
    name: row.name ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    notes: row.notes ?? "",
    visits: Number(row.visits ?? 0),
    lastVisit: row.lastVisit ?? "-",
    orderHistory: Array.isArray(row.orderHistory) ? row.orderHistory : [],
  };
}

export default function CustomerDetailPage() {
  const params = useParams();
  const raw = params?.id;
  const id = Array.isArray(raw) ? raw[0] : raw ?? "";
  const { hydrated, customerRows, setCustomerRows } = useModuleData();
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [customer, setCustomer] = useState(() =>
    customerRows.find((c) => c.id === id) ?? null
  );

  useEffect(() => {
    if (!hydrated || !id) return;
    let alive = true;

    async function loadCustomer() {
      setLoading(true);
      setFetchError(null);
      const cached = customerRows.find((c) => c.id === id);
      if (cached) setCustomer(cached);

      try {
        const res = await fetch(`/api/customers/${id}`, { cache: "no-store" });
        const data = await res.json();
        if (!alive) return;
        if (res.ok && data?.success && data.customer) {
          const row = normalizeCustomer(data.customer);
          setCustomer(row);
          setCustomerRows((prev) => {
            const idx = prev.findIndex((c) => c.id === id);
            if (idx === -1) return [...prev, row];
            return prev.map((c) => (c.id === id ? row : c));
          });
        } else if (!cached) {
          setFetchError(data?.error ?? "Customer not found.");
          setCustomer(null);
        }
      } catch {
        if (alive && !cached) {
          setFetchError("Network error while loading customer.");
          setCustomer(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadCustomer();
    return () => {
      alive = false;
    };
  }, [hydrated, id, setCustomerRows]);

  if (!hydrated || loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 rounded-lg admin-progress-track animate-pulse" />
        <TableSkeleton rows={4} cols={4} />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="admin-surface-card p-10 text-center">
        <p className="text-zinc-400">{fetchError ?? "Customer not found."}</p>
        <Link
          href="/customers"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-ra-primary hover:text-ra-primary-muted"
        >
          <ArrowLeft className="size-4" />
          Back to customers
        </Link>
      </div>
    );
  }

  const lastVisitLabel =
    customer.lastVisit && customer.lastVisit !== "-"
      ? customer.lastVisit
      : "Never";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link
        href="/customers"
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover-ra-primary"
      >
        <ArrowLeft className="size-4" />
        Customers
      </Link>

      <div>
        <h1 className="admin-page-title text-2xl font-semibold tracking-tight">
          {customer.name}
        </h1>
        <p className="admin-page-desc mt-1 text-sm">
          Guest profile · {customer.visits} visits · last visit {lastVisitLabel}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="admin-surface-card p-5 transition-colors hover:border-zinc-700">
          <div className="flex items-center gap-2 text-zinc-500">
            <Phone className="size-4 text-ra-primary/80" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Phone
            </span>
          </div>
          <p className="mt-2 tabular-nums admin-shell-text">{customer.phone}</p>
        </div>
        <div className="admin-surface-card p-5 transition-colors hover:border-zinc-700">
          <div className="flex items-center gap-2 text-zinc-500">
            <Mail className="size-4 text-ra-primary/80" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Email
            </span>
          </div>
          <p className="mt-2 truncate admin-shell-text">{customer.email || "—"}</p>
        </div>
        <div className="admin-surface-card p-5 sm:col-span-2">
          <div className="flex items-center gap-2 text-zinc-500">
            <StickyNote className="size-4 text-ra-primary/80" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Notes
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed admin-surface-body">
            {customer.notes || "No notes on file."}
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold admin-shell-text">Order history</h2>
        <p className="admin-page-desc mt-1 text-sm">
          Orders linked from POS when this guest was selected at checkout.
        </p>
        <CustomerOrderHistoryTable orders={customer.orderHistory ?? []} />
      </div>
    </div>
  );
}
