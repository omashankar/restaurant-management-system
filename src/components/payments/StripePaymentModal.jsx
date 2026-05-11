"use client";

import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Loader2, X } from "lucide-react";
import { useMemo, useState } from "react";

function PaymentForm({
  clientSecret,
  returnUrl,
  submitLabel,
  onPaid,
  onError,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    onError("");
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl },
        redirect: "if_required",
      });
      if (error) {
        onError(error.message ?? "Payment failed.");
        return;
      }
      const retrieved = await stripe.retrievePaymentIntent(clientSecret);
      const pi = retrieved.paymentIntent;
      if (!pi?.id) {
        onError("Could not verify payment.");
        return;
      }
      if (pi.status !== "succeeded") {
        onError(`Payment status: ${pi.status}. If money was debited, refresh or contact support.`);
        return;
      }
      await onPaid(pi.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || busy}
        className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {busy ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Processing…
          </span>
        ) : (
          submitLabel
        )}
      </button>
    </form>
  );
}

/**
 * Stripe Payment Element in a modal overlay.
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {string} props.publishableKey
 * @param {string} props.clientSecret
 * @param {string} props.returnUrl — used for redirect-based methods (e.g. wallet)
 * @param {(paymentIntentId: string) => Promise<void>} props.onPaid — after server-verifiable success
 * @param {string} [props.title]
 * @param {string} [props.submitLabel]
 */
export default function StripePaymentModal({
  open,
  onClose,
  publishableKey,
  clientSecret,
  returnUrl,
  onPaid,
  title = "Pay securely",
  submitLabel = "Pay now",
}) {
  const stripePromise = useMemo(() => {
    if (!publishableKey) return null;
    return loadStripe(publishableKey);
  }, [publishableKey]);
  const [formError, setFormError] = useState("");

  if (!open || !clientSecret || !publishableKey || !stripePromise) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stripe-pay-title"
    >
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>
        <h2 id="stripe-pay-title" className="pr-10 text-lg font-semibold text-zinc-900">
          {title}
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Secured by Stripe. You can complete cards, wallets, or other methods your account supports.
        </p>
        {formError ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
            {formError}
          </p>
        ) : null}
        <div className="mt-4">
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: { theme: "stripe", variables: { colorPrimary: "#059669" } },
            }}
          >
            <PaymentForm
              clientSecret={clientSecret}
              returnUrl={returnUrl}
              submitLabel={submitLabel}
              onError={setFormError}
              onPaid={onPaid}
            />
          </Elements>
        </div>
      </div>
    </div>
  );
}
