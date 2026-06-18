"use client";

import { formatSaMoney } from "@/lib/formatSaMoney";
import {
  getAssignPlanSchedulePreview,
  planPriceForBillingCycle,
  withAutoAssignEndDate,
} from "@/lib/formValidation";
import { intInputProps } from "@/lib/formInputTypes";
import { useMemo } from "react";

const TRIAL_PRESETS = [0, 7, 14];

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-400">{message}</p>;
}

function displayDate(value, formatDate) {
  if (!value) return "Today";
  if (formatDate) return formatDate(value);
  const [y, m, d] = value.split("-");
  if (!y || !m || !d) return value;
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ScheduleTimeline({ preview, price, billingCycle, formatDate }) {
  const { schedule, initialStatus, cycleLabel } = preview;
  const hasTrial = schedule.trialDays > 0;

  return (
    <div className="rounded-xl border border-sky-500/25 bg-sky-500/5 p-3 sm:p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-400">Subscription timeline</p>
      <dl className="mt-3 space-y-2 text-xs">
        <div className="flex justify-between gap-3">
          <dt className="admin-surface-muted shrink-0">Starts</dt>
          <dd className="text-right font-medium admin-shell-text">{displayDate(preview.startLabel, formatDate)}</dd>
        </div>
        {hasTrial && (
          <div className="flex justify-between gap-3">
            <dt className="admin-surface-muted shrink-0">Free trial</dt>
            <dd className="text-right font-medium text-sky-300">
              {schedule.trialDays} days → until {displayDate(preview.trialEndLabel, formatDate)}
            </dd>
          </div>
        )}
        <div className="flex justify-between gap-3">
          <dt className="admin-surface-muted shrink-0">Paid period</dt>
          <dd className="text-right font-medium admin-shell-text">
            1 {cycleLabel} from {displayDate(preview.billingStartLabel, formatDate)}
          </dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-sky-500/20 pt-2">
          <dt className="admin-surface-muted shrink-0">Expires</dt>
          <dd className="text-right font-semibold text-sky-200">{displayDate(preview.endLabel, formatDate)}</dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-sky-500/20 pt-2">
          <span className="admin-surface-muted">
            {schedule.totalDays} days total
            {hasTrial ? ` (${schedule.trialPhaseDays} trial + ${schedule.paidDays} paid)` : ""}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ring-1 ${
              initialStatus === "trial"
                ? "bg-sky-500/15 text-sky-300 ring-sky-500/30"
                : "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30"
            }`}>
              {initialStatus}
            </span>
            {price > 0 && (
              <span className="font-semibold tabular-nums text-sky-200">
                {formatSaMoney(price)}/{billingCycle}
              </span>
            )}
          </span>
        </div>
      </dl>
    </div>
  );
}

/**
 * Shared Assign Plan form — used on Plans and Billing pages.
 */
export default function AssignPlanFormFields({
  form,
  setForm,
  fieldErrors,
  clearFieldError,
  error,
  restaurants = [],
  plans = [],
  inputCls,
  labelCls = "text-xs font-medium admin-surface-muted",
  formatDate,
  onSubmit,
}) {
  const preview = useMemo(() => getAssignPlanSchedulePreview(form), [form]);
  const selectedPlan = plans.find((p) => p.slug === form.planSlug);
  const price = selectedPlan ? planPriceForBillingCycle(selectedPlan, form.billingCycle) : 0;

  const patch = (changes) => {
    setForm((f) => withAutoAssignEndDate({ ...f, ...changes }));
  };

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
      )}

      <section className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide admin-surface-faint">Restaurant & plan</p>
        <div>
          <label className={labelCls}>Restaurant *</label>
          <select
            value={form.restaurantId}
            onChange={(e) => {
              setForm((f) => ({ ...f, restaurantId: e.target.value }));
              clearFieldError("restaurantId");
            }}
            aria-invalid={fieldErrors.restaurantId ? true : undefined}
            className={`cursor-pointer mt-1 block w-full ${inputCls}`}
          >
            <option value="">— Select restaurant —</option>
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} — {r.adminEmail ?? r.ownerEmail ?? ""}
              </option>
            ))}
          </select>
          <FieldError message={fieldErrors.restaurantId} />
        </div>
        <div>
          <label className={labelCls}>Plan *</label>
          <select
            value={form.planSlug}
            onChange={(e) => {
              setForm((f) => ({ ...f, planSlug: e.target.value }));
              clearFieldError("planSlug");
            }}
            aria-invalid={fieldErrors.planSlug ? true : undefined}
            className={`cursor-pointer mt-1 block w-full ${inputCls}`}
          >
            <option value="">— Select plan —</option>
            {plans.map((p) => {
              const amount = planPriceForBillingCycle(p, form.billingCycle);
              const label = amount === 0
                ? `${p.name} — Free`
                : `${p.name} — ${formatSaMoney(amount)}/${form.billingCycle}`;
              return (
                <option key={p.id} value={p.slug}>{label}</option>
              );
            })}
          </select>
          <FieldError message={fieldErrors.planSlug} />
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide admin-surface-faint">Billing & trial</p>
        <div>
          <label className={labelCls}>Billing cycle *</label>
          <div className="mt-1 inline-flex rounded-xl border admin-shell-border p-1">
            {["monthly", "yearly"].map((cycle) => (
              <button
                key={cycle}
                type="button"
                onClick={() => patch({ billingCycle: cycle })}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  form.billingCycle === cycle
                    ? "bg-sa-primary text-zinc-950"
                    : "admin-surface-muted hover:bg-[var(--admin-hover)]"
                }`}
              >
                {cycle}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelCls}>Trial days</label>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {TRIAL_PRESETS.map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => {
                  patch({ trialDays: String(days) });
                  clearFieldError("trialDays");
                }}
                className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                  String(form.trialDays) === String(days)
                    ? "border-sa-primary bg-sa-primary/15 text-sa-primary"
                    : "admin-shell-border admin-surface-muted hover:bg-[var(--admin-hover)]"
                }`}
              >
                {days === 0 ? "No trial" : `${days} days`}
              </button>
            ))}
            <input
              {...intInputProps({ min: 0, max: 90, step: 1 })}
              value={form.trialDays}
              onChange={(e) => {
                const v = e.target.value.replace(/[^\d]/g, "");
                patch({ trialDays: v });
                clearFieldError("trialDays");
              }}
              placeholder="Custom"
              aria-label="Custom trial days"
              aria-invalid={fieldErrors.trialDays ? true : undefined}
              className={`w-20 ${inputCls}`}
            />
          </div>
          <FieldError message={fieldErrors.trialDays} />
          <p className="mt-1.5 text-[11px] admin-surface-faint">
            Trial runs first; paid {form.billingCycle === "yearly" ? "year" : "month"} starts after trial ends.
          </p>
        </div>
      </section>

      <ScheduleTimeline
        preview={preview}
        price={price}
        billingCycle={form.billingCycle}
        formatDate={formatDate}
      />

      <section className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide admin-surface-faint">Dates</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Start date</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => {
                patch({ startDate: e.target.value });
                clearFieldError("startDate");
                clearFieldError("endDate");
              }}
              aria-invalid={fieldErrors.startDate ? true : undefined}
              className={`mt-1 block w-full ${inputCls}`}
            />
            <FieldError message={fieldErrors.startDate} />
            <p className="mt-1 text-[11px] admin-surface-faint">Leave blank to start today</p>
          </div>
          <div>
            <label className={labelCls}>End date</label>
            <input
              type="date"
              readOnly
              value={form.endDate}
              aria-invalid={fieldErrors.endDate ? true : undefined}
              className={`mt-1 block w-full cursor-default opacity-90 ${inputCls}`}
            />
            <FieldError message={fieldErrors.endDate} />
            <p className="mt-1 text-[11px] admin-surface-faint">Auto-calculated from trial + billing cycle</p>
          </div>
        </div>
      </section>
    </form>
  );
}
