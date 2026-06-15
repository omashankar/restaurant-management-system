"use client";

import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Legacy URL — redirects to combined auth page with Register tab. */
export default function CustomerSignupRedirectPage() {
  const router = useRouter();
  const { link } = useRestaurantSlug();

  useEffect(() => {
    router.replace(link("/account/login?tab=register"));
  }, [router, link]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="size-8 animate-spin text-customer-primary" />
    </div>
  );
}
