"use client";

import { adminSurface } from "@/config/adminSurfaceClasses";
import { raIconBadgeCls, raSpinnerCls, raPageRefreshBtnCls } from "@/config/restaurantAdminTheme";
import StripePaymentModal from "@/components/payments/StripePaymentModal";
import PaymentTransactionsSection from "@/components/payment-settings/PaymentTransactionsSection";
import { useAdminLocale } from "@/context/RestaurantLocaleContext";
import { useRestaurantTheme } from "@/hooks/useRestaurantTheme";
import { useToast } from "@/hooks/useToast";
import { CheckCircle2, CreditCard, Loader2, RefreshCw } from "lucide-react";
import {
  loadRazorpayScript,
  openRazorpayCheckout,
  startGatewayCheckout,
} from "@/lib/gatewayCheckoutClient";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const PLAN_COLORS = [
  "border-sky-500/30 bg-sky-500/5",
  "border-indigo-500/30 bg-indigo-500/5",
  "border-ra-primary-30 bg-ra-primary-5",
  "border-amber-500/30 bg-amber-500/5",
];

const TABS = [
  { id: "subscription", label: "Subscription" },
  { id: "transactions", label: "Transactions" },
];

function BillingPageSkeleton() {
  return (
    <>
      <div className="grid min-w-0 gap-4 lg:grid-cols-3">
        <div className="h-32 animate-pulse rounded-2xl admin-surface-card lg:col-span-2" />
        <div className="h-32 animate-pulse rounded-2xl admin-surface-card" />
      </div>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="h-52 animate-pulse rounded-2xl admin-surface-card" />
        ))}
      </div>
    </>
  );
}

export default function BillingPage() {
  const { formatDate } = useAdminLocale();
  const [activeTab, setActiveTab] = useState("subscription");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [submittingPlan, setSubmittingPlan] = useState("");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [stripeSession, setStripeSession] = useState(null);
  const { theme } = useRestaurantTheme();
  const { showToast, ToastUI } = useToast();

  const hadDataRef = useRef(false);

  const fetchOverview = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setFetchError(null);
    try {
      const res = await fetch("/api/billing/overview", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        const msg = data?.error ?? "Failed to load billing data.";
        setFetchError(msg);
        if (!silent) showToast(msg, "error");
        return;
      }
      setProfile(data.profile ?? null);
      setSubscription(data.subscription ?? null);
      setPlans(Array.isArray(data.plans) ? data.plans : []);
      hadDataRef.current = true;
    } catch {
      const msg = "Failed to load billing data.";
      setFetchError(msg);
      if (!silent) showToast(msg, "error");
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchOverview(hadDataRef.current);
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

      const paymentPayload = {
        gatewayProvider: startData.gatewayProvider,
        checkout: startData.checkout,
      };

      clearSpinnerInFinally = false;
      const launched = startGatewayCheckout(paymentPayload, {
        onRazorpay: async (checkout) => {
          const loaded = await loadRazorpayScript();
          if (!loaded) {
            showToast("Could not load payment gateway. Try again.", "error");
            setSubmittingPlan("");
            return;
          }
          openRazorpayCheckout({
            checkout,
            options: {
              name: profile?.restaurantName?.trim() || "BhojDesk Restaurant Management System",
              description: `${plan.name} - ${billingCycle}`,
              prefill: {
                name: profile?.restaurantName ?? "",
                email: profile?.ownerEmail ?? "",
              },
              theme: { color: theme.primaryColor },
            },
            onSuccess: async (response) => {
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
              fetchOverview(true);
            },
            onError: () => {
              setSubmittingPlan("");
              showToast("Payment failed. Please retry.", "error");
            },
            onDismiss: () => {
              setSubmittingPlan("");
              showToast("Payment cancelled.", "error");
            },
          });
        },
        onStripe: (checkout) => {
          const publishableKey = checkout.publishableKey || "";
          if (!publishableKey) {
            showToast("Stripe publishable key missing in payment settings.", "error");
            setSubmittingPlan("");
            return;
          }
          setStripeSession({
            clientSecret: checkout.clientSecret,
            publishableKey,
            paymentId: startData.paymentId,
            planName: plan.name,
            provider: "stripe",
          });
          setSubmittingPlan("");
        },
        onPaytmComplete: async () => {
          setSubmittingPlan("");
          const confirmRes = await fetch("/api/billing/confirm-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId: startData.paymentId, provider: "paytm" }),
          });
          const confirmData = await confirmRes.json();
          if (confirmData?.success) {
            showToast("Subscription activated successfully.");
            fetchOverview();
          } else {
            showToast(confirmData?.error ?? "Payment confirmation failed.", "error");
          }
        },
        onError: (msg) => {
          setSubmittingPlan("");
          showToast(msg || "No payment gateway is configured.", "error");
        },
      });

      if (launched) {
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
    <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`mt-1 shrink-0 ${raIconBadgeCls}`}>
            <CreditCard className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="admin-page-title break-words text-xl font-semibold tracking-tight sm:text-2xl">Billing</h1>
            <p className="admin-page-desc mt-1 break-words text-sm">Manage your subscription plan and view payment transactions.</p>
          </div>
        </div>
        <div className="admin-page-header-actions">
          {/* Tabs */}
          <div
            className="admin-surface-segment-track inline-flex w-full min-w-0 max-w-full p-0.5 sm:w-auto"
            role="tablist"
            aria-label="Billing sections"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-9 min-w-0 flex-1 cursor-pointer whitespace-nowrap rounded-lg border border-transparent px-3 py-2 text-sm font-medium transition-[background-color,color] sm:flex-none sm:px-4 ${
                  activeTab === tab.id
                    ? "bg-ra-primary text-zinc-950"
                    : "admin-surface-muted hover:bg-[var(--admin-hover)] hover:admin-shell-text"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {activeTab === "subscription" && (
            <button
              type="button"
              onClick={() => fetchOverview(true)}
              disabled={refreshing}
              className={raPageRefreshBtnCls}
            >
              <RefreshCw className={`size-4 ${refreshing ? raSpinnerCls : ""}`} />
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Transactions Tab */}
      {activeTab === "transactions" && (
        <PaymentTransactionsSection showToast={showToast} />
      )}

      {/* Subscription Tab */}
      {activeTab === "subscription" && (<div className={`min-w-0 space-y-6 transition-opacity duration-200 ${refreshing ? "opacity-70" : ""}`}>

      {fetchError ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {fetchError}
        </div>
      ) : null}

      {loading ? (
        <BillingPageSkeleton />
      ) : (
        <>
      <div className="grid min-w-0 gap-4 lg:grid-cols-3">
        <div className="min-w-0 admin-surface-card p-4 sm:p-5 lg:col-span-2">
          <p className={`text-xs font-semibold uppercase tracking-wider ${adminSurface.muted}`}>Current Plan</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3">
            <h2 className="break-words text-xl font-semibold admin-shell-text">{currentPlan?.name ?? "Free"}</h2>
            <span className="rounded-full bg-ra-primary-15 px-2.5 py-0.5 text-xs font-semibold capitalize text-ra-primary ring-1 ring-ra-primary-25">
              {subscription?.status ?? profile?.subscriptionStatus ?? "active"}
            </span>
          </div>
          <p className="mt-2 break-words text-sm admin-surface-muted">
            {subscription?.endDate
              ? `Valid until ${formatDate(subscription.endDate)}`
              : "No expiry date available."}
          </p>
        </div>

        <div className="min-w-0 admin-surface-card p-4 sm:p-5">
          <p className={`text-xs font-semibold uppercase tracking-wider ${adminSurface.muted}`}>Billing Cycle</p>
          <div
            className="admin-surface-segment-track mt-3 inline-flex w-full min-w-0 p-0.5"
            role="group"
            aria-label="Billing cycle"
          >
            {[
              { id: "monthly", label: "Monthly" },
              { id: "yearly", label: "Yearly" },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setBillingCycle(id)}
                aria-pressed={billingCycle === id}
                className={`min-h-9 min-w-0 flex-1 cursor-pointer whitespace-nowrap rounded-lg border border-transparent px-3 py-2 text-sm font-semibold transition-[background-color,color] ${
                  billingCycle === id
                    ? "bg-ra-primary text-zinc-950"
                    : "admin-surface-muted hover:bg-[var(--admin-hover)] hover:admin-shell-text"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

        <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan, idx) => {
            const isCurrent = plan.slug === currentPlanSlug;
            const amount = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
            const planKey = plan.id ?? plan.slug ?? `plan-${idx}`;
            return (
              <div
                key={planKey}
                className={`min-w-0 rounded-2xl border p-4 sm:p-5 ${PLAN_COLORS[idx % PLAN_COLORS.length]} ${isCurrent ? "ring-1 ring-ra-primary-25" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="min-w-0 break-words text-lg font-semibold admin-shell-text">{plan.name}</h3>
                  {isCurrent && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-ra-primary-15 px-2 py-0.5 text-xs font-semibold text-ra-primary-muted ring-1 ring-ra-primary-25">
                      <CheckCircle2 className="size-3" />
                      Current
                    </span>
                  )}
                </div>
                <p className="mt-2 break-all text-3xl font-bold tabular-nums admin-shell-text">
                  Rs {Number(amount ?? 0).toLocaleString("en-IN")}
                  <span className="ml-1 text-sm font-medium text-zinc-500">/{billingCycle === "yearly" ? "year" : "month"}</span>
                </p>
                <p className="mt-2 min-h-10 text-sm admin-surface-muted">{plan.description || "No description provided."}</p>
                <ul className="mt-4 space-y-1 text-xs text-zinc-400">
                  {plan.features.slice(0, 4).map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                  {plan.features.length > 4 && <li>• +{plan.features.length - 4} more features</li>}
                </ul>
                <button
                  type="button"
                  disabled={
                    isCurrent ||
                    submittingPlan === plan.slug ||
                    Number(amount ?? 0) <= 0
                  }
                  onClick={() => startSubscription(plan)}
                  className="mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-ra-primary px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submittingPlan === plan.slug ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrent ? (
                    "Current plan"
                  ) : Number(amount ?? 0) <= 0 ? (
                    "Included"
                  ) : (
                    "Upgrade / Renew"
                  )}
                </button>
              </div>
            );
          })}
        </div>
        </>
      )}
      {stripeSession ? (
        <StripePaymentModal
          open={!!stripeSession}
          publishableKey={stripeSession.publishableKey}
          clientSecret={stripeSession.clientSecret}
          title={`Subscribe — ${stripeSession.planName}`}
          returnUrl={
            typeof window !== "undefined"
              ? `${window.location.origin}/dashboard`
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
              fetchOverview(true);
            } catch {
              setStripeSession(null);
              showToast("Network error confirming payment.", "error");
            }
          }}
        />
      ) : null}

      </div>)}

      {ToastUI}
    </div>
  );
}
