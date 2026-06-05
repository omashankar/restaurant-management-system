"use client";

import SectionCard, { Field, Input, Toggle } from "./SectionCard";

const FREQUENCIES = [
  { value: "daily",   label: "Daily Settlement",   desc: "Settled every day" },
  { value: "weekly",  label: "Weekly Settlement",  desc: "Settled every Monday" },
  { value: "monthly", label: "Monthly Settlement", desc: "Settled on 1st of each month" },
  { value: "manual",  label: "Manual Withdrawal",  desc: "You request payouts manually" },
];

export default function SettlementSection({ data, onChange, onSave }) {
  return (
    <SectionCard
      title="Settlement Settings"
      description="Choose how and when your earnings are settled to your bank account."
      onSave={onSave}
      data={data}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {FREQUENCIES.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => onChange({ ...data, frequency: f.value })}
            className={`cursor-pointer rounded-xl border p-4 text-left transition-all ${
              data.frequency === f.value
                ? "border-ra-primary-40 bg-ra-primary-10 ring-1 ring-ra-primary-25"
                : "admin-shell-border bg-[var(--admin-hover)] hover:border-[var(--admin-border)]"
            }`}
          >
            <p className={`text-sm font-semibold ${data.frequency === f.value ? "text-ra-primary" : "admin-shell-text"}`}>
              {f.label}
            </p>
            <p className="mt-0.5 text-xs admin-surface-muted">{f.desc}</p>
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Minimum Withdrawal Amount" hint="Payouts below this amount are held.">
          <Input
            type="number"
            value={String(data.minWithdrawalAmount ?? 100)}
            onChange={(v) => onChange({ ...data, minWithdrawalAmount: Number(v) || 100 })}
            placeholder="100"
          />
        </Field>
      </div>

      <div className="mt-4">
        <Toggle
          label="Auto Settlement"
          hint="Automatically settle earnings on schedule without manual requests."
          checked={Boolean(data.autoSettle)}
          onChange={(v) => onChange({ ...data, autoSettle: v })}
        />
      </div>
    </SectionCard>
  );
}
