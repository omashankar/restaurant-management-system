"use client";

import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_KEYS } from "@/config/paymentConfig";
import SectionCard, { Toggle, Field } from "./SectionCard";

export default function PaymentMethodsSection({ data, onChange, onSave }) {
  function toggle(key) {
    onChange({ ...data, [key]: !data[key] });
  }

  return (
    <SectionCard
      title="Payment Methods"
      description="Enable or disable payment options available to customers at checkout."
      onSave={onSave}
      data={data}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {PAYMENT_METHOD_KEYS.map((key) => (
          <Toggle
            key={key}
            label={PAYMENT_METHOD_LABELS[key]}
            checked={Boolean(data[key])}
            onChange={() => toggle(key)}
          />
        ))}
      </div>

      <div className="mt-5">
        <Field label="Default Payment Method">
          <select
            value={data.defaultMethod ?? "cod"}
            onChange={(e) => onChange({ ...data, defaultMethod: e.target.value })}
            className="w-full cursor-pointer rounded-xl border admin-shell-border bg-[var(--admin-control)] px-3 py-2.5 text-sm admin-shell-text outline-none transition-colors focus-ra-primary"
          >
            {PAYMENT_METHOD_KEYS.filter((k) => data[k]).map((k) => (
              <option key={k} value={k}>{PAYMENT_METHOD_LABELS[k]}</option>
            ))}
          </select>
        </Field>
      </div>
    </SectionCard>
  );
}
