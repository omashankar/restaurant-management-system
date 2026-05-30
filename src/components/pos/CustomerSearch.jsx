"use client";

import PhoneInput from "@/components/ui/PhoneInput";

import { useCustomerSearch } from "@/hooks/useCustomerSearch";
import { getCustomerFormFieldErrors } from "@/lib/formValidation";
import { extractIndianMobileDigits } from "@/lib/phoneUtils";
import { Loader2, UserPlus, X } from "lucide-react";
import { useState } from "react";

const EMPTY_FIELD_ERRORS = { name: "", phone: "", email: "" };

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
  const [addError, setAddError] = useState("");
  const [fieldErrors, setFieldErrors] = useState(EMPTY_FIELD_ERRORS);
  const [saving, setSaving] = useState(false);

  const openAddForm = (prefill = {}) => {
    setShowAddForm(true);
    setAddError("");
    setFieldErrors(EMPTY_FIELD_ERRORS);
    setNewForm({
      name: prefill.name ?? "",
      phone: prefill.phone ?? "",
      email: prefill.email ?? "",
    });
  };

  const handleSelect = (customer) => {
    setSelected(customer);
    onCustomerSelect?.(customer);
    setQuery("");
    setShowAddForm(false);
    setFieldErrors(EMPTY_FIELD_ERRORS);
    setAddError("");
  };

  const handleAdd = async (e) => {
    e?.preventDefault?.();
    const validation = getCustomerFormFieldErrors(newForm);
    setFieldErrors(validation.errors);
    const firstError = validation.message;
    if (firstError) return;

    setSaving(true);
    setAddError("");
    const result = await addCustomer(newForm);
    setSaving(false);

    if (!result.ok) {
      setAddError(result.error ?? "Could not add customer.");
      return;
    }

    handleSelect(result.customer);
    setNewForm({ name: "", phone: "", email: "" });
  };

  const handleClear = () => {
    clearSelection();
    onCustomerSelect?.(null);
    setShowAddForm(false);
    setFieldErrors(EMPTY_FIELD_ERRORS);
    setAddError("");
  };

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-ra-primary-30 bg-ra-primary-5 px-3 py-2.5">
        <div>
          <p className="text-sm font-semibold text-ra-primary-muted">{selected.name}</p>
          <p className="text-xs text-zinc-500">
            {selected.phone}
            {selected.email ? ` · ${selected.email}` : ""}
          </p>
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
      <div className="flex items-center gap-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/80">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!showAddForm) setShowAddForm(false);
          }}
          placeholder="Search name or phone"
          className="flex-1 bg-transparent py-2.5 pl-4 pr-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
        />
        <button
          type="button"
          onClick={() => {
            if (showAddForm) {
              setShowAddForm(false);
              setFieldErrors(EMPTY_FIELD_ERRORS);
              setAddError("");
            } else {
              openAddForm();
            }
          }}
          className="cursor-pointer m-1 flex size-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 transition-colors hover:bg-zinc-700 hover-ra-primary"
          aria-label="Add new customer"
          title="Add new customer"
        >
          <UserPlus className="size-4" />
        </button>
      </div>

      {query.trim() && !showAddForm && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl shadow-black/30">
          {results.length > 0 ? (
            <ul className="divide-y divide-zinc-800/60">
              {results.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(c)}
                    className="cursor-pointer flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-800/60"
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
          ) : (
            <p className="px-4 py-3 text-xs text-zinc-500">No matching customers.</p>
          )}

          <button
            type="button"
            onClick={() => {
              const raw = query.trim();
              const digits = extractIndianMobileDigits(raw);
              const looksLikePhone = digits.length >= 3;
              openAddForm({
                phone: looksLikePhone ? digits : "",
                name: looksLikePhone ? "" : raw,
              });
              setQuery("");
            }}
            className="cursor-pointer flex w-full items-center gap-2 border-t border-zinc-800/60 px-4 py-3 text-sm font-semibold text-ra-primary transition-colors hover:bg-zinc-800/60"
          >
            <UserPlus className="size-4" />
            Add new customer
          </button>
        </div>
      )}

      {showAddForm && (
        <form
          noValidate
          onSubmit={handleAdd}
          className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/80 p-3"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">New Customer</p>
          <div>
            <label className="mb-1 block text-[10px] font-medium text-zinc-500">
              Full name <span className="text-red-400">*</span>
            </label>
            <input
              value={newForm.name}
              onChange={(e) => {
                setNewForm((f) => ({ ...f, name: e.target.value }));
                if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: "" }));
              }}
              placeholder="e.g. Rahul Sharma"
              maxLength={80}
              aria-invalid={fieldErrors.name ? true : undefined}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus-ra-primary"
            />
            {fieldErrors.name && <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>}
          </div>
          <PhoneInput
            id="pos-new-customer-phone"
            label="Mobile"
            labelClassName="mb-1 block text-[10px] font-medium text-zinc-500"
            required
            value={newForm.phone}
            onChange={(digits) => {
              setNewForm((f) => ({ ...f, phone: digits }));
              if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: "" }));
            }}
            error={fieldErrors.phone || undefined}
            showPrefix
          />
          <div>
            <label className="mb-1 block text-[10px] font-medium text-zinc-500">Email (optional)</label>
            <input
              type="email"
              value={newForm.email}
              onChange={(e) => {
                setNewForm((f) => ({ ...f, email: e.target.value }));
                if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: "" }));
              }}
              placeholder="name@example.com"
              aria-invalid={fieldErrors.email ? true : undefined}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus-ra-primary"
            />
            {fieldErrors.email && <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>}
          </div>
          {addError && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1.5 text-xs text-red-400">
              {addError}
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="cursor-pointer flex flex-1 items-center justify-center gap-2 rounded-xl bg-ra-primary py-2 text-sm font-semibold text-zinc-950 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save & Select"
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setFieldErrors(EMPTY_FIELD_ERRORS);
                setAddError("");
              }}
              disabled={saving}
              className="cursor-pointer rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
