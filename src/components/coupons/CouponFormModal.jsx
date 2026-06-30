"use client";

import Modal from "@/components/ui/Modal";
import { adminControl } from "@/config/adminDesignSystem";
import {
  COUPON_CHANNELS,
  COUPON_TYPES,
  CUSTOMER_ELIGIBILITY,
  ORDER_TYPES,
  PAYMENT_METHOD_OPTIONS,
  WEEKDAYS,
} from "@/lib/couponSchema";
import { useEffect, useState } from "react";

export const EMPTY_COUPON_FORM = {
  code: "",
  label: "",
  description: "",
  type: "percent",
  value: "",
  maxDiscount: "",
  minSubtotal: "",
  maxSubtotal: "",
  minQty: "",
  channels: ["online", "pos"],
  orderTypes: ["dine-in", "takeaway", "delivery"],
  paymentMethods: [],
  applicableDays: [0, 1, 2, 3, 4, 5, 6],
  startTime: "",
  endTime: "",
  active: true,
  usageLimit: "",
  dailyLimit: "",
  monthlyLimit: "",
  startsAt: "",
  expiresAt: "",
  customerEligibility: "all",
  allowWithPoints: true,
  preventStacking: true,
  onePerCustomer: false,
  autoApply: false,
};

const TABS = [
  { id: "basic", label: "Basic" },
  { id: "validity", label: "Validity" },
  { id: "rules", label: "Rules" },
  { id: "options", label: "Options" },
];

export function couponToForm(coupon) {
  if (!coupon) return { ...EMPTY_COUPON_FORM };
  return {
    code: coupon.code,
    label: coupon.label,
    description: coupon.description ?? "",
    type: coupon.type ?? "percent",
    value: String(coupon.value ?? ""),
    maxDiscount: coupon.maxDiscount != null ? String(coupon.maxDiscount) : "",
    minSubtotal: coupon.minSubtotal != null ? String(coupon.minSubtotal) : "",
    maxSubtotal: coupon.maxSubtotal != null ? String(coupon.maxSubtotal) : "",
    minQty: coupon.minQty != null ? String(coupon.minQty) : "",
    channels: coupon.channels ?? ["online", "pos"],
    orderTypes: coupon.orderTypes ?? ["dine-in", "takeaway", "delivery"],
    paymentMethods: coupon.paymentMethods ?? [],
    applicableDays: coupon.applicableDays ?? [0, 1, 2, 3, 4, 5, 6],
    startTime: coupon.startTime ?? "",
    endTime: coupon.endTime ?? "",
    active: coupon.active !== false,
    usageLimit: coupon.usageLimit != null ? String(coupon.usageLimit) : "",
    dailyLimit: coupon.dailyLimit != null ? String(coupon.dailyLimit) : "",
    monthlyLimit: coupon.monthlyLimit != null ? String(coupon.monthlyLimit) : "",
    startsAt: coupon.startsAt ? String(coupon.startsAt).slice(0, 10) : "",
    expiresAt: coupon.expiresAt ? String(coupon.expiresAt).slice(0, 10) : "",
    customerEligibility: coupon.customerEligibility ?? "all",
    allowWithPoints: coupon.allowWithPoints !== false,
    preventStacking: coupon.preventStacking !== false,
    onePerCustomer: coupon.onePerCustomer === true,
    autoApply: coupon.autoApply === true,
  };
}

function ChipToggle({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? "border-ra-primary/40 bg-ra-primary/15 text-ra-primary"
          : "admin-shell-border admin-surface-muted hover:border-ra-primary/20"
      }`}
    >
      {children}
    </button>
  );
}

function FieldHint({ children }) {
  return <p className="mt-1 text-[11px] admin-surface-muted">{children}</p>;
}

export default function CouponFormModal({
  open,
  editingId,
  form,
  setForm,
  formError,
  saving,
  onClose,
  onSave,
}) {
  const [tab, setTab] = useState("basic");

  useEffect(() => {
    if (open) setTab("basic");
  }, [open, editingId]);

  const toggleList = (key, id) => {
    setForm((prev) => {
      const has = prev[key].includes(id);
      const next = has ? prev[key].filter((x) => x !== id) : [...prev[key], id];
      return { ...prev, [key]: next.length ? next : [id] };
    });
  };

  const isFreeDelivery = form.type === "free_delivery";
  const allDaysSelected = form.applicableDays.length === 7;

  return (
    <Modal
      open={open}
      wide
      onClose={() => !saving && onClose()}
      title={editingId ? "Edit coupon" : "New coupon"}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] admin-surface-muted">
            * Required · Code is shown to customers on menu & checkout
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="rounded-xl border admin-shell-border px-4 py-2 text-sm admin-surface-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={onSave}
              className="rounded-xl bg-ra-primary px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save coupon"}
            </button>
          </div>
        </div>
      }
    >
      <div className="min-w-0 space-y-4">
        {formError ? (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {formError}
          </p>
        ) : null}

        <div className="flex gap-1 overflow-x-auto rounded-xl border admin-shell-border p-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`shrink-0 cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                tab === id
                  ? "bg-ra-primary/15 text-ra-primary"
                  : "admin-surface-muted hover:bg-[var(--admin-hover)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "basic" ? (
          <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium admin-surface-muted">Code *</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  className={`${adminControl.input} w-full px-3 py-2 text-sm font-mono uppercase`}
                  placeholder="SAVE10"
                  maxLength={20}
                />
                <FieldHint>Unique code customers enter at checkout</FieldHint>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium admin-surface-muted">Name *</label>
                <input
                  value={form.label}
                  onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                  className={`${adminControl.input} w-full px-3 py-2 text-sm`}
                  placeholder="Save 10% on orders"
                />
                <FieldHint>Shown on customer menu & offers</FieldHint>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium admin-surface-muted">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  className={`${adminControl.input} w-full px-3 py-2 text-sm`}
                  placeholder="Optional internal note or customer-facing details"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium admin-surface-muted">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                  className={`${adminControl.input} w-full px-3 py-2 text-sm`}
                >
                  {COUPON_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              {!isFreeDelivery ? (
                <div>
                  <label className="mb-1 block text-xs font-medium admin-surface-muted">
                    Value * {form.type === "percent" ? "(%)" : "(₹)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step={form.type === "percent" ? "1" : "0.01"}
                    max={form.type === "percent" ? "100" : undefined}
                    value={form.value}
                    onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
                    className={`${adminControl.input} w-full px-3 py-2 text-sm`}
                    placeholder={form.type === "percent" ? "10" : "50"}
                  />
                </div>
              ) : (
                <div className="flex items-end">
                  <p className="rounded-lg border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-xs text-sky-200">
                    Waives delivery charge on eligible delivery orders
                  </p>
                </div>
              )}
              {form.type === "percent" ? (
                <div>
                  <label className="mb-1 block text-xs font-medium admin-surface-muted">Max discount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.maxDiscount}
                    onChange={(e) => setForm((p) => ({ ...p, maxDiscount: e.target.value }))}
                    className={`${adminControl.input} w-full px-3 py-2 text-sm`}
                    placeholder="Optional cap"
                  />
                </div>
              ) : null}
            </div>

            <div>
              <p className="mb-2 text-xs font-medium admin-surface-muted">Channels *</p>
              <div className="flex flex-wrap gap-2">
                {COUPON_CHANNELS.map((ch) => (
                  <ChipToggle key={ch} active={form.channels.includes(ch)} onClick={() => toggleList("channels", ch)}>
                    {ch === "online" ? "Online checkout" : "In-store POS"}
                  </ChipToggle>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {tab === "validity" ? (
          <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium admin-surface-muted">Start date</label>
                <input
                  type="date"
                  value={form.startsAt}
                  onChange={(e) => setForm((p) => ({ ...p, startsAt: e.target.value }))}
                  className={`${adminControl.input} w-full px-3 py-2 text-sm`}
                />
                <FieldHint>Leave empty to start immediately</FieldHint>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium admin-surface-muted">End date</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
                  className={`${adminControl.input} w-full px-3 py-2 text-sm`}
                />
                <FieldHint>Leave empty for no expiry</FieldHint>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium admin-surface-muted">Daily start time</label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
                  className={`${adminControl.input} w-full px-3 py-2 text-sm`}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium admin-surface-muted">Daily end time</label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))}
                  className={`${adminControl.input} w-full px-3 py-2 text-sm`}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium admin-surface-muted">Applicable days</p>
                <button
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      applicableDays: allDaysSelected ? [] : WEEKDAYS.map((d) => d.id),
                    }))
                  }
                  className="cursor-pointer text-[11px] font-semibold text-ra-primary hover:underline"
                >
                  {allDaysSelected ? "Clear all" : "Select all days"}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((d) => (
                  <ChipToggle
                    key={d.id}
                    active={form.applicableDays.includes(d.id)}
                    onClick={() => toggleList("applicableDays", d.id)}
                  >
                    {d.label}
                  </ChipToggle>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm admin-surface-muted">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
              />
              Active (customers can use this coupon)
            </label>
          </section>
        ) : null}

        {tab === "rules" ? (
          <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium admin-surface-muted">Min order amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={form.minSubtotal}
                  onChange={(e) => setForm((p) => ({ ...p, minSubtotal: e.target.value }))}
                  className={`${adminControl.input} w-full px-3 py-2 text-sm`}
                  placeholder="e.g. 30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium admin-surface-muted">Max order amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={form.maxSubtotal}
                  onChange={(e) => setForm((p) => ({ ...p, maxSubtotal: e.target.value }))}
                  className={`${adminControl.input} w-full px-3 py-2 text-sm`}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium admin-surface-muted">Min item quantity</label>
                <input
                  type="number"
                  min="1"
                  value={form.minQty}
                  onChange={(e) => setForm((p) => ({ ...p, minQty: e.target.value }))}
                  className={`${adminControl.input} w-full px-3 py-2 text-sm`}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium admin-surface-muted">Total redemption limit</label>
                <input
                  type="number"
                  min="1"
                  value={form.usageLimit}
                  onChange={(e) => setForm((p) => ({ ...p, usageLimit: e.target.value }))}
                  className={`${adminControl.input} w-full px-3 py-2 text-sm`}
                  placeholder="Unlimited if empty"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium admin-surface-muted">Daily limit</label>
                <input
                  type="number"
                  min="1"
                  value={form.dailyLimit}
                  onChange={(e) => setForm((p) => ({ ...p, dailyLimit: e.target.value }))}
                  className={`${adminControl.input} w-full px-3 py-2 text-sm`}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium admin-surface-muted">Monthly limit</label>
                <input
                  type="number"
                  min="1"
                  value={form.monthlyLimit}
                  onChange={(e) => setForm((p) => ({ ...p, monthlyLimit: e.target.value }))}
                  className={`${adminControl.input} w-full px-3 py-2 text-sm`}
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium admin-surface-muted">Order types</p>
              <div className="flex flex-wrap gap-2">
                {ORDER_TYPES.map((t) => (
                  <ChipToggle key={t.id} active={form.orderTypes.includes(t.id)} onClick={() => toggleList("orderTypes", t.id)}>
                    {t.label}
                  </ChipToggle>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium admin-surface-muted">Payment methods</p>
              <FieldHint>Leave none selected to allow all payment methods</FieldHint>
              <div className="mt-2 flex flex-wrap gap-2">
                {PAYMENT_METHOD_OPTIONS.map((p) => (
                  <ChipToggle
                    key={p.id}
                    active={form.paymentMethods.includes(p.id)}
                    onClick={() =>
                      setForm((prev) => {
                        const has = prev.paymentMethods.includes(p.id);
                        const next = has
                          ? prev.paymentMethods.filter((x) => x !== p.id)
                          : [...prev.paymentMethods, p.id];
                        return { ...prev, paymentMethods: next };
                      })
                    }
                  >
                    {p.label}
                  </ChipToggle>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium admin-surface-muted">Customer eligibility</label>
              <select
                value={form.customerEligibility}
                onChange={(e) => setForm((p) => ({ ...p, customerEligibility: e.target.value }))}
                className={`${adminControl.input} w-full px-3 py-2 text-sm`}
              >
                {CUSTOMER_ELIGIBILITY.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </section>
        ) : null}

        {tab === "options" ? (
          <section className="space-y-3 rounded-xl border admin-shell-border p-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-ra-primary">Stacking & behaviour</h3>
            <label className="flex items-start gap-2 text-sm admin-surface-muted">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={form.onePerCustomer}
                onChange={(e) => setForm((p) => ({ ...p, onePerCustomer: e.target.checked }))}
              />
              <span>
                <span className="font-medium admin-shell-text">One coupon per customer</span>
                <span className="mt-0.5 block text-xs">Each customer can redeem this code only once</span>
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm admin-surface-muted">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={form.allowWithPoints}
                onChange={(e) => setForm((p) => ({ ...p, allowWithPoints: e.target.checked }))}
              />
              <span>
                <span className="font-medium admin-shell-text">Allow with loyalty points</span>
                <span className="mt-0.5 block text-xs">Customer can combine with reward points</span>
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm admin-surface-muted">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={form.preventStacking}
                onChange={(e) => setForm((p) => ({ ...p, preventStacking: e.target.checked }))}
              />
              <span>
                <span className="font-medium admin-shell-text">Prevent other discounts</span>
                <span className="mt-0.5 block text-xs">Blocks manual POS discount when this coupon is used</span>
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm admin-surface-muted">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={form.autoApply}
                onChange={(e) => setForm((p) => ({ ...p, autoApply: e.target.checked }))}
              />
              <span>
                <span className="font-medium admin-shell-text">Auto-apply online</span>
                <span className="mt-0.5 block text-xs">Automatically applied at checkout when eligible</span>
              </span>
            </label>
          </section>
        ) : null}
      </div>
    </Modal>
  );
}
