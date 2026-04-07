"use client";

import { useCustomerSearch } from "@/hooks/useCustomerSearch";
import { UserPlus, X } from "lucide-react";
import { useState } from "react";

export default function CustomerSearch({ onCustomerSelect }) {
  const {
    query, setQuery,
    results,
    selected, setSelected,
    addCustomer,
    clearSelection,
  } = useCustomerSearch();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", phone: "", email: "" });

  const handleSelect = (customer) => {
    setSelected(customer);
    onCustomerSelect?.(customer);
    setQuery("");
    setShowAddForm(false);
  };

  const handleAdd = () => {
    if (!newForm.name.trim() || !newForm.phone.trim()) return;
    const c = addCustomer(newForm);
    onCustomerSelect?.(c);
    setNewForm({ name: "", phone: "", email: "" });
    setShowAddForm(false);
  };

  const handleClear = () => {
    clearSelection();
    onCustomerSelect?.(null);
    setShowAddForm(false);
  };

  // Selected state
  if (selected) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5">
        <div>
          <p className="text-sm font-semibold text-emerald-300">{selected.name}</p>
          <p className="text-xs text-zinc-500">{selected.phone}{selected.email ? ` · ${selected.email}` : ""}</p>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="cursor-pointer rounded-lg p-1 text-zinc-500 hover:text-zinc-200"
          aria-label="Remove customer"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Search input */}
      <div className="flex items-center gap-0 rounded-xl border border-zinc-800 bg-zinc-950/80 overflow-hidden">
        <input
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowAddForm(false); }}
          placeholder="Customer"
          className="flex-1 bg-transparent py-2.5 pl-4 pr-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none"
        />
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center justify-center size-10 m-1 rounded-lg bg-zinc-800 text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-emerald-400 shrink-0"
          aria-label="Add new customer"
          title="Add new customer"
        >
          <UserPlus className="size-4" />
        </button>
      </div>

      {/* Results dropdown */}
      {query.trim() && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl shadow-black/30">
          {results.length > 0 ? (
            <ul className="divide-y divide-zinc-800/60">
              {results.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(c)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-800/60"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-100">{c.name}</p>
                      <p className="text-xs text-zinc-500">{c.phone}</p>
                    </div>
                    <span className="text-xs text-zinc-600">{c.visits ?? 0} visits</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {/* Add new option */}
          <button
            type="button"
            onClick={() => {
              setShowAddForm(true);
              // Pre-fill phone if query looks like a number
              const looksLikePhone = /^[\d\s+\-()]{5,}$/.test(query.trim());
              setNewForm((f) => ({
                ...f,
                phone: looksLikePhone ? query.trim() : f.phone,
                name: !looksLikePhone ? query.trim() : f.name,
              }));
            }}
            className="flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-emerald-400 transition-colors hover:bg-zinc-800/60"
          >
            <UserPlus className="size-4" />
            Add new customer
          </button>
        </div>
      )}

      {/* Add new form */}
      {showAddForm && (
        <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">New Customer</p>
          <input
            value={newForm.name}
            onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Full name *"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/40"
          />
          <input
            value={newForm.phone}
            onChange={(e) => setNewForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="Phone *"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/40"
          />
          <input
            value={newForm.email}
            onChange={(e) => setNewForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="Email (optional)"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/40"
          />
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newForm.name.trim() || !newForm.phone.trim()}
              className="cursor-pointer flex-1 rounded-xl bg-emerald-500 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-40"
            >
              Save & Select
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
