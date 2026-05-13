"use client";

import { ShieldCheck } from "lucide-react";
import SectionCard, { Field, Input } from "./SectionCard";

export default function BankAccountSection({ data, onChange, onSave }) {
  function update(key, value) {
    onChange({ ...data, [key]: value });
  }

  return (
    <SectionCard
      title="Bank Account Details"
      description="Your settlement payouts will be sent to this account. Sensitive fields are masked for security."
      onSave={onSave}
      data={data}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Account Holder Name">
          <Input
            value={data.accountHolderName}
            onChange={(v) => update("accountHolderName", v)}
            placeholder="Full name as on bank account"
          />
        </Field>
        <Field label="Bank Name">
          <Input
            value={data.bankName}
            onChange={(v) => update("bankName", v)}
            placeholder="e.g. HDFC Bank"
          />
        </Field>
        <Field label="Account Number" hint="Masked for security after saving.">
          <Input
            value={data.accountNumber}
            onChange={(v) => update("accountNumber", v)}
            placeholder="Enter account number"
          />
        </Field>
        <Field label="IFSC Code">
          <Input
            value={data.ifscCode}
            onChange={(v) => update("ifscCode", v.toUpperCase())}
            placeholder="e.g. HDFC0001234"
          />
        </Field>
        <Field label="Branch Name">
          <Input
            value={data.branchName}
            onChange={(v) => update("branchName", v)}
            placeholder="e.g. Connaught Place, New Delhi"
          />
        </Field>
        <Field label="UPI ID" hint="For instant settlements via UPI.">
          <Input
            value={data.upiId}
            onChange={(v) => update("upiId", v)}
            placeholder="yourname@upi"
          />
        </Field>
      </div>

      {/* Verification badge */}
      {data.verified && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          <ShieldCheck className="size-4 shrink-0" />
          Bank account verified
        </div>
      )}

      {!data.verified && data.accountNumber && (
        <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          Bank account not yet verified. Contact support to verify your account.
        </div>
      )}
    </SectionCard>
  );
}
