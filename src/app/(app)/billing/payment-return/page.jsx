"use client";

import { useToast } from "@/hooks/useToast";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function BillingPaymentReturnInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [message, setMessage] = useState("Verifying subscription payment…");

  useEffect(() => {
    const paymentId = searchParams.get("paymentId");
    const provider = searchParams.get("provider");
    if (!paymentId || !provider) {
      setMessage("Invalid payment return.");
      return;
    }

    const payload = { paymentId, provider };
    for (const [key, value] of searchParams.entries()) {
      if (!["paymentId", "provider"].includes(key) && value) payload[key] = value;
    }

    (async () => {
      try {
        const res = await fetch("/api/billing/confirm-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data?.success) {
          showToast("Subscription activated successfully.");
          router.replace("/billing");
          return;
        }
        setMessage(data?.error || "Payment could not be verified.");
        showToast(data?.error || "Payment verification failed.", "error");
      } catch {
        setMessage("Network error while verifying payment.");
        showToast("Network error.", "error");
      }
    })();
  }, [searchParams, router, showToast]);

  return (
    <div className="flex min-h-[50vh] min-w-0 flex-col items-center justify-center gap-4 px-4 text-center">
      <Loader2 className="size-8 animate-spin text-ra-primary" />
      <p className="max-w-md break-words text-sm text-zinc-500">{message}</p>
    </div>
  );
}

export default function BillingPaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-ra-primary" />
        </div>
      }
    >
      <BillingPaymentReturnInner />
    </Suspense>
  );
}
