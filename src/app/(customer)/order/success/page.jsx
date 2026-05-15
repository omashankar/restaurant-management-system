"use client";

import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { CheckCircle2, Clock, ShoppingBag, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("id") ?? "ORD-XXXX";
  const { link } = useRestaurantSlug();

  return (
    <div className="mx-auto flex min-h-[85vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="w-full rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
      {/* Icon */}
      <div className="relative">
        <span className="flex size-24 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 ring-2 ring-emerald-500/30">
          <CheckCircle2 className="size-12" />
        </span>
        <span className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/30">
          <ShoppingBag className="size-3.5" />
        </span>
      </div>

      <h1 className="mt-7 text-3xl font-bold text-zinc-900">Order Placed!</h1>
      <p className="mt-2 max-w-sm text-sm text-zinc-600">
        Your order has been received and is being prepared. We&apos;ll have it ready soon.
      </p>
      <p className="mt-1 text-xs text-zinc-500">You can place another order anytime from the menu.</p>

      {/* Order ID */}
      <div className="mt-7 rounded-2xl border border-zinc-200 bg-zinc-50 px-8 py-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Order ID</p>
        <p className="mt-1.5 font-mono text-xl font-bold text-emerald-700">{orderId}</p>
      </div>

      {/* Est. time */}
      <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 text-sm text-amber-700">
        <Clock className="size-4 shrink-0" />
        Estimated time: <span className="font-bold">20–30 minutes</span>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={link("/order/menu")}
          className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-400"
        >
          <UtensilsCrossed className="size-4" /> Order Again
        </Link>
        <Link
          href={link("/home")}
          className="cursor-pointer inline-flex items-center rounded-xl border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:text-zinc-900"
        >
          Back to Home
        </Link>
      </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
