"use client";

import SectionCard, { Field, Input } from "./SectionCard";

export default function TaxSettingsSection({ data, onChange, onSave }) {
  function update(key, value) {
    onChange({ ...data, [key]: value });
  }

  return (
    <SectionCard
      title="Tax Settings"
      description="Configure GST and tax details. These are applied automatically during checkout."
      onSave={onSave}
      data={data}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="GST Number" hint="Your GSTIN registration number.">
          <Input
            value={data.gstNumber}
            onChange={(v) => update("gstNumber", v.toUpperCase())}
            placeholder="e.g. 22AAAAA0000A1Z5"
          />
        </Field>
        <Field label="GST Percentage (%)" hint="Applied on order subtotal.">
          <Input
            type="number"
            value={data.gstPercentage}
            onChange={(v) => update("gstPercentage", v)}
            placeholder="18"
          />
        </Field>
        <Field label="PAN Number" hint="Permanent Account Number for tax filing.">
          <Input
            value={data.panNumber}
            onChange={(v) => update("panNumber", v.toUpperCase())}
            placeholder="AAAAA0000A"
          />
        </Field>
        <Field label="Invoice Prefix" hint="Prefix for auto-generated invoice numbers.">
          <Input
            value={data.invoicePrefix}
            onChange={(v) => update("invoicePrefix", v.toUpperCase())}
            placeholder="INV"
          />
        </Field>
      </div>

      {data.gstNumber && (
        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3 text-xs text-zinc-500">
          GST will be auto-applied at <span className="font-semibold text-zinc-300">{data.gstPercentage || 0}%</span> on all orders.
          Invoices will be prefixed with <span className="font-semibold text-zinc-300">{data.invoicePrefix || "INV"}</span>.
        </div>
      )}
    </SectionCard>
  );
}
