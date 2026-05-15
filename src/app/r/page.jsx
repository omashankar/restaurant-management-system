/**
 * /r  →  Saare active restaurants ki list
 * Customer yahan se apna restaurant choose karta hai.
 */

import clientPromise from "@/lib/mongodb";
import Link from "next/link";
import { Store, MapPin, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Choose a Restaurant",
  description: "Select a restaurant to browse the menu and place your order.",
};

export const revalidate = 60; // 1 minute cache

async function getRestaurants() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const restaurants = await db
      .collection("restaurants")
      .find({ status: "active", slug: { $exists: true, $ne: "" } })
      .sort({ name: 1 })
      .project({ name: 1, slug: 1, address: 1, phone: 1, logoUrl: 1 })
      .limit(100)
      .toArray();
    return restaurants.map((r) => ({
      id: r._id.toString(),
      name: r.name ?? "Restaurant",
      slug: r.slug,
      address: r.address ?? "",
      phone: r.phone ?? "",
      logoUrl: r.logoUrl ?? null,
    }));
  } catch {
    return [];
  }
}

export default async function RestaurantListPage() {
  const restaurants = await getRestaurants();

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-800">
            <Store className="size-3.5" />
            All Restaurants
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Choose a Restaurant
          </h1>
          <p className="mt-3 text-base text-zinc-600">
            Select a restaurant below to browse the menu and place your order.
          </p>
        </div>

        {/* Restaurant Grid */}
        {restaurants.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center">
            <Store className="mx-auto size-12 text-zinc-300" />
            <p className="mt-4 text-sm font-medium text-zinc-600">
              No restaurants available right now.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((r) => (
              <Link
                key={r.id}
                href={`/r/${r.slug}/home`}
                className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm ring-1 ring-zinc-100 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/30 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                {/* Logo / Icon */}
                <div className="mb-4 flex size-14 items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-100">
                  {r.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.logoUrl}
                      alt={r.name}
                      className="size-10 rounded-lg object-cover"
                    />
                  ) : (
                    <Store className="size-7 text-emerald-600" />
                  )}
                </div>

                <h2 className="text-base font-bold text-zinc-900 group-hover:text-emerald-700 transition-colors">
                  {r.name}
                </h2>

                {r.address && (
                  <p className="mt-1.5 flex items-start gap-1.5 text-xs text-zinc-500">
                    <MapPin className="mt-0.5 size-3 shrink-0 text-zinc-400" />
                    <span className="line-clamp-2">{r.address}</span>
                  </p>
                )}

                <div className="mt-auto flex items-center justify-between pt-4">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-800">
                    Open
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    View menu <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
