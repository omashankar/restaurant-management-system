"use client";

import { formatAdminMoney } from "@/lib/adminCurrency";

const CARDS = [
  { key: "totalCoupons", label: "Total coupons" },
  { key: "activeCoupons", label: "Active" },
  { key: "couponsRedeemed", label: "Redeemed" },
  { key: "totalDiscountGiven", label: "Discount given", money: true },
];

export default function CouponStatsCards({ stats, currency = "INR" }) {
  if (!stats) return null;

  return (
    <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {CARDS.map(({ key, label, money }) => (
        <div key={key} className="rounded-2xl border admin-shell-border bg-[var(--admin-card)] p-4">
          <p className="text-xs font-medium admin-surface-muted">{label}</p>
          <p className="mt-1 font-poppins text-2xl font-bold admin-shell-text">
            {money
              ? formatAdminMoney(stats[key] ?? 0, currency, { decimals: 0 })
              : (stats[key] ?? 0)}
          </p>
        </div>
      ))}
      {stats.topCoupons?.length ? (
        <div className="rounded-2xl border admin-shell-border bg-[var(--admin-card)] p-4 sm:col-span-2 xl:col-span-4">
          <p className="text-xs font-semibold uppercase tracking-wide admin-surface-muted">Most used</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {stats.topCoupons.map((row) => (
              <span
                key={row.code}
                className="rounded-full border admin-shell-border px-3 py-1 text-xs font-mono text-ra-primary"
              >
                {row.code} · {row.redemptions}×
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
