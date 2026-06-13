"use client";

import { useCustomer } from "@/context/CustomerContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { customerClasses } from "@/lib/customerTheme";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function PaymentReturnInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { link } = useRestaurantSlug();
  const { showToast } = useCustomer();
  const [message, setMessage] = useState("Verifying your payment…");

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    const provider = searchParams.get("provider");
    if (!orderId || !provider) {
      setMessage("Invalid payment return.");
      return;
    }

    const payload = { orderId, provider };
    for (const [key, value] of searchParams.entries()) {
      if (!["orderId", "provider"].includes(key) && value) payload[key] = value;
    }

    (async () => {
      try {
        const res = await fetch("/api/customer/orders/confirm-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data?.success && !data?.pending) {
          showToast("Payment successful.");
          router.replace(link(`/order/success?id=${encodeURIComponent(orderId)}`));
          return;
        }
        if (data?.success && data?.pending) {
          showToast("Payment submitted. Awaiting confirmation.");
          router.replace(link(`/order/success?id=${encodeURIComponent(orderId)}`));
          return;
        }
        setMessage(data?.error || "Payment could not be verified.");
        showToast(data?.error || "Payment verification failed.", "error");
      } catch {
        setMessage("Network error while verifying payment.");
        showToast("Network error.", "error");
      }
    })();
  }, [searchParams, router, link, showToast]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <Loader2 className="size-8 animate-spin text-customer-primary" />
      <p className={`text-sm ${customerClasses.textMuted}`}>{message}</p>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-customer-primary" />
        </div>
      }
    >
      <PaymentReturnInner />
    </Suspense>
  );
}
