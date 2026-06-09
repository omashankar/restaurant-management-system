"use client";

import { useRestaurantInfo } from "@/hooks/useRestaurantInfo";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { customerClasses, customerPage, customerType } from "@/lib/customerTheme";
import Link from "next/link";

export default function CustomerPrivacyPage() {
  const { info } = useRestaurantInfo();
  const { link } = useRestaurantSlug();
  const name = info.name?.trim() || "Our Restaurant";

  return (
    <div className={customerPage.shell}>
      <div className={`${customerPage.narrow} py-10 sm:py-14`}>
        <article className="ct-surface-card rounded-3xl p-6 sm:p-10">
          <span className={customerClasses.badge}>Legal</span>
          <h1 className={`${customerType.heroTitle} text-2xl sm:text-3xl`}>Privacy Policy</h1>
          <p className="mt-1 text-sm text-customer-muted">{name}</p>

          <div className="mt-6 space-y-4 text-sm leading-relaxed text-customer-muted">
            <p>
              {name} respects your privacy. This policy explains what information we collect when you
              visit our website, place orders, book tables, or contact us.
            </p>
            <section>
              <h2 className="font-semibold text-customer-text">Information we collect</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Name, phone number, and email when you register or checkout</li>
                <li>Delivery address for delivery orders</li>
                <li>Order and booking history</li>
                <li>Messages you send us by phone or email</li>
              </ul>
            </section>
            <section>
              <h2 className="font-semibold text-customer-text">How we use it</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Process orders, reservations, and customer support</li>
                <li>Send order updates via SMS or WhatsApp (if enabled)</li>
                <li>Improve our menu and service quality</li>
              </ul>
            </section>
            <section>
              <h2 className="font-semibold text-customer-text">Your rights</h2>
              <p className="mt-2">
                You may request access, correction, or deletion of your data by contacting us
                {info.email ? ` at ${info.email}` : ""}
                {info.phone ? ` or ${info.phone}` : ""}.
              </p>
            </section>
            <p className="text-xs text-customer-muted">Last updated: {new Date().toLocaleDateString()}</p>
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
