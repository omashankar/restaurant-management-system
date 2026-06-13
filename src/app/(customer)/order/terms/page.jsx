"use client";

import { useCustomerLocale } from "@/context/CustomerLocaleContext";
import { useRestaurantInfo } from "@/hooks/useRestaurantInfo";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { customerClasses, customerPage, customerType } from "@/lib/customerTheme";
import Link from "next/link";

export default function CustomerTermsPage() {
  const { formatDate } = useCustomerLocale();
  const { info } = useRestaurantInfo();
  const { link } = useRestaurantSlug();
  const name = info.name?.trim() || "Our Restaurant";

  return (
    <div className={customerPage.shell}>
      <div className={`${customerPage.narrow} py-10 sm:py-14`}>
        <article className="ct-surface-card rounded-3xl p-6 sm:p-10">
          <span className={customerClasses.badge}>Legal</span>
          <h1 className={`${customerType.heroTitle} text-2xl sm:text-3xl`}>Terms &amp; Conditions</h1>
          <p className="mt-1 text-sm text-customer-muted">{name}</p>

          <div className="mt-6 space-y-4 text-sm leading-relaxed text-customer-muted">
            <p>
              By using the {name} website to order food or book a table, you agree to these terms.
            </p>
            <section>
              <h2 className="font-semibold text-customer-text">Orders &amp; payments</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Prices and availability may change without notice</li>
                <li>Online payments are processed by secure payment providers</li>
                <li>Cash on delivery may be available where offered</li>
              </ul>
            </section>
            <section>
              <h2 className="font-semibold text-customer-text">Cancellations &amp; refunds</h2>
              <p className="mt-2">
                Cancellation and refund policies are handled by the restaurant. Contact us
                {info.phone ? ` at ${info.phone}` : ""} for order issues.
              </p>
            </section>
            <section>
              <h2 className="font-semibold text-customer-text">Table reservations</h2>
              <p className="mt-2">
                Please arrive on time for your booking. The restaurant may release your table if you are
                significantly late.
              </p>
            </section>
            <section>
              <h2 className="font-semibold text-customer-text">Loyalty points</h2>
              <p className="mt-2">
                Reward points are earned on completed orders (1 point per ₹10 spent). Points have no
                cash value unless a redemption program is announced by the restaurant.
              </p>
            </section>
            <p className="text-xs text-customer-muted">Last updated: {formatDate(new Date())}</p>
          </div>

          <p className="mt-8">
            <Link href={link("/home")} className="text-sm font-semibold text-customer-primary hover:underline">
              ← Back to home
            </Link>
          </p>
        </article>
      </div>
    </div>
  );
}
