"use client";

import StripePaymentModal from "@/components/payments/StripePaymentModal";
import { useToast } from "@/hooks/useToast";
import { CheckCircle2, CreditCard, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const PLAN_COLORS = [
  "border-sky-500/30 bg-sky-500/5",
  "border-indigo-500/30 bg-indigo-500/5",
  "border-emerald-500/30 bg-emerald-500/5",
  "border-amber-500/30 bg-amber-500/5",
];

async function loadRazorpayScript() {
  if (typeof window === "undefined") return false;
  if (window.Razorpay) return true;
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [submittingPlan, setSubmittingPlan] = useState("");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [stripeSession, setStripeSession] = useState(null);
  const { showToast, ToastUI } = useToast();

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/overview", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        showToast(data?.error ?? "Failed to load billing data.", "error");
        return;
      }
      setProfile(data.profile ?? null);
      setSubscription(data.subscription ?? null);
      setPlans(Array.isArray(data.plans) ? data.plans : []);
    } catch {
      showToast("Failed to load billing data.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const currentPlanSlug = subscription?.planSlug ?? profile?.currentPlan ?? "free";
  const currentPlan = useMemo(
    () => plans.find((p) => p.slug === currentPlanSlug) ?? null,
    [plans, currentPlanSlug]
  );

  async function startSubscription(plan) {
    if (!plan?.slug) return;
    setSubmittingPlan(plan.slug);
    let clearSpinnerInFinally = true;
    try {
      const startRes = await fetch("/api/billing/start-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planSlug: plan.slug,
          billingCycle,
          method: "upi",
        }),
      });
      const startData = await startRes.json();
      if (!startRes.ok || !startData?.success) {
        showToast(startData?.error ?? "Failed to initialize payment.", "error");
        return;
      }

      if (startData.gatewayProvider === "razorpay" && startData.checkout?.orderId) {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          showToast("Could not load payment gateway. Try again.", "error");
          return;
        }

        clearSpinnerInFinally = false;
        const rz = new window.Razorpay({
          key: startData.checkout.key,
          order_id: startData.checkout.orderId,
          amount: startData.checkout.amount,
          currency: startData.checkout.currency,
          name: "Restaurant Management System",
          description: `${plan.name} - ${billingCycle}`,
          prefill: {
            name: profile?.restaurantName ?? "",
            email: profile?.ownerEmail ?? "",
          },
          handler: async (response) => {
            setSubmittingPlan("");
            const confirmRes = await fetch("/api/billing/confirm-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                paymentId: startData.paymentId,
                provider: "razorpay",
                ...response,
              }),
            });
            const confirmData = await confirmRes.json();
            if (!confirmRes.ok || !confirmData?.success) {
              showToast(confirmData?.error ?? "Payment confirmation failed.", "error");
              return;
            }
            showToast("Subscription activated successfully.");
            fetchOverview();
          },
          modal: {
            ondismiss: () => {
              setSubmittingPlan("");
              showToast("Payment cancelled.", "error");
            },
          },
          theme: { color: "#10b981" },
        });

        rz.on("payment.failed", () => {
          setSubmittingPlan("");
          showToast("Payment failed. Please retry.", "error");
        });
        setSubmittingPlan("");
        rz.open();
        return;
      }

      if (startData.gatewayProvider === "stripe" && startData.checkout?.clientSecret) {
        const publishableKey =
          startData.checkout.publishableKey || "";
        if (!publishableKey) {
          showToast(
            "Stripe publishable key missing. Add Super Admin → Payment settings.",
            "error"
          );
          return;
        }
        clearSpinnerInFinally = false;
        setStripeSession({
          clientSecret: startData.checkout.clientSecret,
          publishableKey,
          paymentId: startData.paymentId,
          planName: plan.name,
        });
        setSubmittingPlan("");
        return;
      }

      showToast("No payment gateway is configured.", "error");
    } catch {
      showToast("Network error while processing payment.", "error");
    } finally {
      if (clearSpinnerInFinally) setSubmittingPlan("");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/25">
            <CreditCard className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Billing</h1>
            <p className="mt-1 text-sm text-zinc-500">Choose plan and pay subscription to keep your restaurant active.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={fetchOverview}
          className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-zinc-500"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Current Plan</p>
          <div className="mt-2 flex items-center gap-3">
            <h2 className="text-xl font-semibold text-zinc-100">{currentPlan?.name ?? "Free"}</h2>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-emerald-400 ring-1 ring-emerald-500/25">
              {subscription?.status ?? profile?.subscriptionStatus ?? "active"}
            </span>
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            {subscription?.endDate
              ? `Valid until ${new Date(subscription.endDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}`
              : "No expiry date available."}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Billing Cycle</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {["monthly", "yearly"].map((cycle) => (
              <button
                key={cycle}
                type="button"
                onClick={() => setBillingCycle(cycle)}
                className={`cursor-pointer rounded-xl border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                  billingCycle === cycle
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                }`}
              >
                {cycle}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-52 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan, idx) => {
            const isCurrent = plan.slug === currentPlanSlug;
            const amount = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
            return (
              <div
                key={plan.id}
                className={`rounded-2xl border p-5 ${PLAN_COLORS[idx % PLAN_COLORS.length]} ${isCurrent ? "ring-1 ring-emerald-500/30" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold text-zinc-100">{plan.name}</h3>
                  {isCurrent && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/25">
                      <CheckCircle2 className="size-3" />
                      Current
                    </span>
                  )}
                </div>
                <p className="mt-2 text-3xl font-bold text-zinc-100">
                  Rs {Number(amount ?? 0).toLocaleString("en-IN")}
                  <span className="ml-1 text-sm font-medium text-zinc-500">/{billingCycle === "yearly" ? "year" : "month"}</span>
                </p>
                <p className="mt-2 min-h-10 text-sm text-zinc-500">{plan.description || "No description provided."}</p>
                <ul className="mt-4 space-y-1 text-xs text-zinc-400">
                  {plan.features.slice(0, 4).map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                  {plan.features.length > 4 && <li>• +{plan.features.length - 4} more features</li>}
                </ul>
                <button
                  type="button"
                  disabled={isCurrent || submittingPlan === plan.slug}
                  onClick={() => startSubscription(plan)}
                  className="mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submittingPlan === plan.slug ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Upgrade / Renew"
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
      {stripeSession ? (
        <StripePaymentModal
          open={!!stripeSession}
          publishableKey={stripeSession.publishableKey}
          clientSecret={stripeSession.clientSecret}
          title={`Subscribe — ${stripeSession.planName}`}
          returnUrl={
            typeof window !== "undefined"
              ? `${window.location.origin}/admin/dashboard`
              : ""
          }
          onClose={() => {
            setStripeSession(null);
            showToast("Payment cancelled.", "error");
          }}
          onPaid={async (paymentIntentId) => {
            const paymentId = stripeSession.paymentId;
            try {
              const confirmRes = await fetch("/api/billing/confirm-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  paymentId,
                  provider: "stripe",
                  paymentIntentId,
                }),
              });
              const confirmData = await confirmRes.json();
              setStripeSession(null);
              if (!confirmRes.ok || !confirmData?.success) {
                showToast(confirmData?.error ?? "Payment confirmation failed.", "error");
                return;
              }
              showToast("Subscription activated successfully.");
              fetchOverview();
            } catch {
              setStripeSession(null);
              showToast("Network error confirming payment.", "error");
            }
          }}
        />
      ) : null}

      {ToastUI}
    </div>
  );
}
