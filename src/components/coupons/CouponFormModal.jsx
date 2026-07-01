"use client";

import Modal from "@/components/ui/Modal";
import { adminControl } from "@/config/adminDesignSystem";
import { ORDER_TYPES } from "@/lib/couponSchema";
import { useMemo } from "react";

export const EMPTY_COUPON_FORM = {
  code: "",
  label: "",
  type: "percent",
  value: "",
  minSubtotal: "",
  startsAt: "",
  expiresAt: "",
  orderTypeScope: "all",
  orderTypes: ["dine-in", "takeaway", "delivery"],
  usageLimitMode: "unlimited",
  usageLimit: "",
  active: true,
};

const ALL_ORDER_TYPES = ORDER_TYPES.map((t) => t.id);

export function couponToForm(coupon) {
  if (!coupon) return { ...EMPTY_COUPON_FORM };
  const orderTypes = coupon.orderTypes ?? ALL_ORDER_TYPES;
  const hasAllTypes =
    ALL_ORDER_TYPES.length === orderTypes.length &&
    ALL_ORDER_TYPES.every((t) => orderTypes.includes(t));

  return {
    code: coupon.code,
    label: coupon.label,
    type: coupon.type === "flat" ? "flat" : "percent",
    value: String(coupon.value ?? ""),
    minSubtotal: coupon.minSubtotal != null ? String(coupon.minSubtotal) : "",
    startsAt: coupon.startsAt ? String(coupon.startsAt).slice(0, 10) : "",
    expiresAt: coupon.expiresAt ? String(coupon.expiresAt).slice(0, 10) : "",
    orderTypeScope: hasAllTypes ? "all" : "specific",
    orderTypes: hasAllTypes ? [...ALL_ORDER_TYPES] : orderTypes,
    usageLimitMode: coupon.usageLimit != null ? "limited" : "unlimited",
    usageLimit: coupon.usageLimit != null ? String(coupon.usageLimit) : "",
    active: coupon.active !== false,
  };
}

export function formToPayload(form) {
  const orderTypes =
    form.orderTypeScope === "all" ? [...ALL_ORDER_TYPES] : form.orderTypes;

  return {
    code: form.code,
    label: form.label,
    type: form.type,
    value: form.value,
    minSubtotal: form.minSubtotal === "" ? null : form.minSubtotal,
    startsAt: form.startsAt || null,
    expiresAt: form.expiresAt || null,
    orderTypes,
    usageLimit: form.usageLimitMode === "limited" ? form.usageLimit : null,
    active: form.active,
    channels: ["online", "pos"],
  };
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
  const orderTypeOptions = useMemo(() => ORDER_TYPES, []);

  const toggleOrderType = (id) => {
    setForm((prev) => {
      const has = prev.orderTypes.includes(id);
      const next = has ? prev.orderTypes.filter((x) => x !== id) : [...prev.orderTypes, id];
      return {
        ...prev,
        orderTypeScope: "specific",
        orderTypes: next.length ? next : [id],
      };
    });
  };

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      title={editingId ? "Edit coupon" : "New coupon"}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
      }
    >
      <div className="min-w-0 space-y-5">
        {formError ? (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {formError}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium admin-surface-muted">Coupon name *</label>
            <input
              value={form.label}
              onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
              className={`${adminControl.input} w-full px-3 py-2 text-sm`}
              placeholder="e.g. Weekend 10% off"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium admin-surface-muted">Coupon code *</label>
            <input
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
              className={`${adminControl.input} w-full px-3 py-2 text-sm font-mono uppercase`}
              placeholder="SAVE10"
              maxLength={20}
            />
            <FieldHint>Must be unique. Customers enter this at checkout.</FieldHint>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium admin-surface-muted">Discount type *</label>
            <select
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              className={`${adminControl.input} w-full px-3 py-2 text-sm`}
            >
              <option value="percent">Percentage (%)</option>
              <option value="flat">Fixed amount (₹)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium admin-surface-muted">
              Discount value * {form.type === "percent" ? "(%)" : "(₹)"}
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
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium admin-surface-muted">
            Minimum order amount (optional)
          </label>
          <input
            type="number"
            min="0"
            value={form.minSubtotal}
            onChange={(e) => setForm((p) => ({ ...p, minSubtotal: e.target.value }))}
            className={`${adminControl.input} w-full max-w-xs px-3 py-2 text-sm`}
            placeholder="e.g. 300"
          />
          <FieldHint>Leave empty if there is no minimum.</FieldHint>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium admin-surface-muted">Valid from *</label>
            <input
              type="date"
              value={form.startsAt}
              onChange={(e) => setForm((p) => ({ ...p, startsAt: e.target.value }))}
              className={`${adminControl.input} w-full px-3 py-2 text-sm`}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium admin-surface-muted">Valid to *</label>
            <input
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
              className={`${adminControl.input} w-full px-3 py-2 text-sm`}
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium admin-surface-muted">Applicable order type *</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setForm((p) => ({
                  ...p,
                  orderTypeScope: "all",
                  orderTypes: [...ALL_ORDER_TYPES],
                }))
              }
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                form.orderTypeScope === "all"
                  ? "border-ra-primary/40 bg-ra-primary/15 text-ra-primary"
                  : "admin-shell-border admin-surface-muted hover:border-ra-primary/20"
              }`}
            >
              All
            </button>
            {orderTypeOptions.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleOrderType(t.id)}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  form.orderTypeScope !== "all" && form.orderTypes.includes(t.id)
                    ? "border-ra-primary/40 bg-ra-primary/15 text-ra-primary"
                    : "admin-shell-border admin-surface-muted hover:border-ra-primary/20"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium admin-surface-muted">Usage limit</p>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm admin-surface-muted">
              <input
                type="radio"
                name="usageLimitMode"
                checked={form.usageLimitMode === "unlimited"}
                onChange={() => setForm((p) => ({ ...p, usageLimitMode: "unlimited", usageLimit: "" }))}
              />
              Unlimited
            </label>
            <label className="flex items-center gap-2 text-sm admin-surface-muted">
              <input
                type="radio"
                name="usageLimitMode"
                checked={form.usageLimitMode === "limited"}
                onChange={() => setForm((p) => ({ ...p, usageLimitMode: "limited" }))}
              />
              Set limit
            </label>
            {form.usageLimitMode === "limited" ? (
              <input
                type="number"
                min="1"
                value={form.usageLimit}
                onChange={(e) => setForm((p) => ({ ...p, usageLimit: e.target.value }))}
                className={`${adminControl.input} w-28 px-3 py-1.5 text-sm`}
                placeholder="100"
              />
            ) : null}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium admin-surface-muted">Status</label>
          <select
            value={form.active ? "active" : "inactive"}
            onChange={(e) => setForm((p) => ({ ...p, active: e.target.value === "active" }))}
            className={`${adminControl.input} w-full max-w-xs px-3 py-2 text-sm`}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <FieldHint>Inactive coupons cannot be used at checkout.</FieldHint>
        </div>
      </div>
    </Modal>
  );
}
