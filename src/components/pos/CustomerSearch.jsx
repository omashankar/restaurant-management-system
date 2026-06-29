"use client";

import PhoneInput from "@/components/ui/PhoneInput";
import Modal from "@/components/ui/Modal";
import { useCustomerSearch } from "@/hooks/useCustomerSearch";
import { getCustomerFormFieldErrors } from "@/lib/formValidation";
import { extractIndianMobileDigits } from "@/lib/phoneUtils";
import { Loader2, UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";

const EMPTY_FIELD_ERRORS = { name: "", phone: "", email: "" };

export default function CustomerSearch({
  onCustomerSelect,
  selectedCustomer = null,
  embedded = false,
  onSelectComplete,
}) {
  const {
    query, setQuery,
    results,
    selected, setSelected,
    addCustomer,
    clearSelection,
  } = useCustomerSearch();

  const activeCustomer = selectedCustomer ?? selected;

  useEffect(() => {
    if (selectedCustomer == null) clearSelection();
  }, [selectedCustomer]);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", phone: "", email: "" });
  const [addError, setAddError] = useState("");
  const [fieldErrors, setFieldErrors] = useState(EMPTY_FIELD_ERRORS);
  const [saving, setSaving] = useState(false);

  const closeAddModal = () => {
    if (saving) return;
    setAddModalOpen(false);
    setFieldErrors(EMPTY_FIELD_ERRORS);
    setAddError("");
  };

  const openAddModal = (prefill = {}) => {
    setAddError("");
    setFieldErrors(EMPTY_FIELD_ERRORS);
    setNewForm({
      name: prefill.name ?? "",
      phone: prefill.phone ?? "",
      email: prefill.email ?? "",
    });
    setAddModalOpen(true);
  };

  const handleSelect = (customer) => {
    setSelected(customer);
    onCustomerSelect?.(customer);
    setQuery("");
    setAddModalOpen(false);
    setFieldErrors(EMPTY_FIELD_ERRORS);
    setAddError("");
    onSelectComplete?.();
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
    setAddModalOpen(false);
    setFieldErrors(EMPTY_FIELD_ERRORS);
    setAddError("");
  };

  if (!embedded && activeCustomer) {
    return (
      <div className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-ra-primary-30 bg-ra-primary-5 px-3 py-2.5 sm:gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ra-primary-muted">{activeCustomer.name}</p>
          <p className="truncate text-xs admin-surface-muted">
            {activeCustomer.phone}
            {activeCustomer.email ? ` · ${activeCustomer.email}` : ""}
          </p>
          <p className="mt-0.5 text-[10px] admin-surface-faint">{activeCustomer.visits ?? 0} visits</p>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="cursor-pointer rounded-lg p-1 admin-surface-muted hover:admin-shell-text"
          aria-label="Remove customer"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  if (embedded && activeCustomer) {
    return (
      <>
        <div className="mb-4 rounded-xl border border-ra-primary-30 bg-ra-primary-5 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ra-primary-muted">Selected</p>
          <p className="mt-1 text-sm font-semibold text-ra-primary-muted">{activeCustomer.name}</p>
          <p className="text-xs admin-surface-muted">
            {activeCustomer.phone}
            {activeCustomer.email ? ` · ${activeCustomer.email}` : ""}
          </p>
        </div>
        <p className="mb-2 text-[11px] admin-surface-muted">Search to change customer or add a new one.</p>
        {renderSearchBody()}
        {renderAddModal()}
      </>
    );
  }

  return (
    <>
      {renderSearchBody()}
      {renderAddModal()}
    </>
  );

  function renderSearchBody() {
  return (
      <div className="space-y-2">
        <div className="flex items-center gap-0 overflow-hidden admin-surface-card">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or phone"
            className="flex-1 bg-transparent py-2.5 pl-4 pr-2 text-sm admin-shell-text outline-none placeholder:admin-surface-muted"
          />
          <button
            type="button"
            onClick={() => openAddModal()}
            className="cursor-pointer m-1 flex size-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800 admin-surface-body transition-colors hover:bg-zinc-700 hover-ra-primary"
            aria-label="Add new customer"
            title="Add new customer"
          >
            <UserPlus className="size-4" />
          </button>
        </div>

        {query.trim() && (
          <div className="rounded-xl border admin-shell-border bg-zinc-900 shadow-xl shadow-black/30">
            {results.length > 0 ? (
              <ul className="admin-table-body">
                {results.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(c)}
                      className="cursor-pointer flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:admin-shell-hover"
                    >
                      <div>
                        <p className="text-sm font-medium admin-shell-text">{c.name}</p>
                        <p className="text-xs admin-surface-muted">{c.phone}</p>
                      </div>
                      <span className="text-xs admin-surface-faint">{c.visits ?? 0} visits</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-3 text-xs admin-surface-muted">No matching customers.</p>
            )}

            <button
              type="button"
              onClick={() => {
                const raw = query.trim();
                const digits = extractIndianMobileDigits(raw);
                const looksLikePhone = digits.length >= 3;
                openAddModal({
                  phone: looksLikePhone ? digits : "",
                  name: looksLikePhone ? "" : raw,
                });
                setQuery("");
              }}
              className="cursor-pointer flex w-full items-center gap-2 border-t admin-shell-border/60 px-4 py-3 text-sm font-semibold text-ra-primary transition-colors hover:admin-shell-hover"
            >
              <UserPlus className="size-4" />
              Add new customer
            </button>
          </div>
        )}
      </div>
    );
  }

  function renderAddModal() {
  return (
      <Modal
        open={addModalOpen}
        onClose={closeAddModal}
        title="Add customer"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeAddModal}
              disabled={saving}
              className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl border admin-shell-border px-4 py-2 text-sm admin-surface-body disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="pos-add-customer-form"
              disabled={saving}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-ra-primary px-4 py-2 text-sm font-semibold text-zinc-950 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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
          </div>
        }
      >
        <form id="pos-add-customer-form" noValidate onSubmit={handleAdd} className="min-w-0 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium admin-surface-muted">
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
              autoFocus
              aria-invalid={fieldErrors.name ? true : undefined}
              className="admin-surface-input focus-ra-primary px-3 py-2"
            />
            {fieldErrors.name && <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>}
          </div>
          <PhoneInput
            id="pos-new-customer-phone"
            label="Mobile"
            labelClassName="mb-1 block text-xs font-medium admin-surface-muted"
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
            <label className="mb-1 block text-xs font-medium admin-surface-muted">Email (optional)</label>
            <input
              type="email"
              value={newForm.email}
              onChange={(e) => {
                setNewForm((f) => ({ ...f, email: e.target.value }));
                if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: "" }));
              }}
              placeholder="name@example.com"
              aria-invalid={fieldErrors.email ? true : undefined}
              className="admin-surface-input focus-ra-primary px-3 py-2"
            />
            {fieldErrors.email && <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>}
          </div>
          {addError && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {addError}
            </p>
          )}
        </form>
      </Modal>
    );
  }
}
