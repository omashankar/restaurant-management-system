"use client";

import { useCustomer } from "@/context/CustomerContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { formatCustomerMoney } from "@/lib/customerCurrency";
import { Calendar, ChevronRight, Heart, Loader2, LogOut, MapPin, ShoppingBag, UserRound, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function displayName(u) {
  if (!u) return "Customer";
  if (u.name?.trim()) return u.name.trim();
  if (u.email) return u.email.split("@")[0];
  return u.phone || "Customer";
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
}

export default function CustomerDashboardPage() {
  const router = useRouter();
  const { authUser, authLoading, refreshAuth, logoutCustomer, showToast } = useCustomer();
  const { link } = useRestaurantSlug();
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [summary, setSummary] = useState({
    favorites: [],
    savedAddresses: [],
    rewardPoints: 0,
    walletBalance: 0,
  });
  const [reorderingId, setReorderingId] = useState("");
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.replace(link("/account/login"));
    }
  }, [authLoading, authUser, router]);

  useEffect(() => {
    if (authUser) {
      setEditName(authUser.name ?? "");
      setEditEmail(authUser.email ?? "");
    }
  }, [authUser]);

  useEffect(() => {
    async function loadData() {
      if (!authUser) return;
      setLoadingData(true);
      const [ordersRes, bookingsRes] = await Promise.all([
        fetch("/api/customer/orders", { cache: "no-store" }),
        fetch("/api/customer/auth/bookings", { cache: "no-store" }),
      ]);
      const [ordersData, bookingsData, summaryData] = await Promise.all([
        ordersRes.json().catch(() => ({ success: false, orders: [] })),
        bookingsRes.json().catch(() => ({ success: false, bookings: [] })),
        fetch("/api/customer/dashboard/summary", { cache: "no-store" })
          .then((r) => r.json())
          .catch(() => ({ success: false, summary: null })),
      ]);
      setOrders(Array.isArray(ordersData.orders) ? ordersData.orders : []);
      setBookings(Array.isArray(bookingsData.bookings) ? bookingsData.bookings : []);
      if (summaryData?.success && summaryData.summary) {
        setSummary({
          favorites: Array.isArray(summaryData.summary.favorites) ? summaryData.summary.favorites : [],
          savedAddresses: Array.isArray(summaryData.summary.savedAddresses) ? summaryData.summary.savedAddresses : [],
          rewardPoints: Number(summaryData.summary.rewardPoints ?? 0),
          walletBalance: Number(summaryData.summary.walletBalance ?? 0),
        });
      }
      setLoadingData(false);
    }
    loadData();
  }, [authUser]);

  const reorder = async (orderId) => {
    setReorderingId(orderId);
    try {
      const res = await fetch(`/api/customer/orders/${orderId}/reorder`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        showToast(data?.error ?? "Could not reorder.", "error");
        return;
      }
      showToast("Reorder placed successfully.");
      router.push(link(`/order/success?id=${encodeURIComponent(data.order.orderId)}`));
    } catch {
      showToast("Network error.", "error");
    } finally {
      setReorderingId("");
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/customer/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, email: editEmail }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        showToast(data?.error ?? "Could not save profile.", "error");
        return;
      }
      await refreshAuth();
      showToast("Profile saved.");
      setProfileOpen(false);
    } catch {
      showToast("Network error.", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  if (authLoading || (!authUser && !authLoading)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-emerald-600" aria-hidden />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:max-w-2xl sm:px-6">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500">Welcome back</p>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">{displayName(authUser)}</h1>
          {authUser.phone ? (
            <p className="mt-1 text-sm text-zinc-600">{authUser.phone}</p>
          ) : authUser.email ? (
            <p className="mt-1 text-sm text-zinc-600">{authUser.email}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={async () => {
            await logoutCustomer();
            router.push(link("/account/login"));
          }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:border-red-400 hover:text-red-600"
        >
          <LogOut className="size-4" aria-hidden />
          Log out
        </button>
      </header>

      <nav className="mb-10 grid grid-cols-3 gap-2 sm:gap-3" aria-label="Quick actions">
        <a
          href="#orders"
          className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-4 text-center shadow-sm transition hover:border-emerald-300 hover:shadow-md"
        >
          <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700">
            <ShoppingBag className="size-5" aria-hidden />
          </span>
          <span className="text-xs font-semibold text-zinc-900">My Orders</span>
        </a>
        <a
          href="#bookings"
          className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-4 text-center shadow-sm transition hover:border-emerald-300 hover:shadow-md"
        >
          <span className="flex size-11 items-center justify-center rounded-xl bg-sky-500/15 text-sky-800">
            <Calendar className="size-5" aria-hidden />
          </span>
          <span className="text-xs font-semibold text-zinc-900">Bookings</span>
        </a>
        <button
          type="button"
          onClick={() => {
            setProfileOpen((v) => !v);
            setTimeout(() => document.getElementById("profile")?.scrollIntoView({ behavior: "smooth" }), 0);
          }}
          className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-4 text-center shadow-sm transition hover:border-emerald-300 hover:shadow-md"
        >
          <span className="flex size-11 items-center justify-center rounded-xl bg-violet-500/15 text-violet-800">
            <UserRound className="size-5" aria-hidden />
          </span>
          <span className="text-xs font-semibold text-zinc-900">Profile</span>
        </button>
      </nav>

      <section id="orders" className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-zinc-900">Order history</h2>
        <p className="mt-0.5 text-sm text-zinc-600">Track status for recent orders.</p>
        {loadingData ? (
          <div className="mt-6 flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-emerald-600" aria-hidden />
          </div>
        ) : orders.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No orders yet. Browse the menu to place your first order.</p>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-100">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={link(`/account/orders/${o.id}`)}
                  className="flex items-center gap-3 py-3 transition hover:bg-zinc-50/80 sm:rounded-xl sm:px-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-zinc-900">{o.orderId}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${o.chipClass ?? ""}`}
                      >
                        <span aria-hidden>{o.statusEmoji}</span>
                        {o.statusLabel ?? o.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-500">{formatDate(o.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="font-semibold text-zinc-900">{formatCustomerMoney(Number(o.total ?? 0))}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        reorder(o.id);
                      }}
                      disabled={reorderingId === o.id}
                      className="ml-2 rounded-lg border border-zinc-300 px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:border-emerald-500/40 hover:text-emerald-700 disabled:opacity-50"
                    >
                      {reorderingId === o.id ? "Reordering..." : "Reorder"}
                    </button>
                    <ChevronRight className="size-4 text-zinc-400" aria-hidden />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="bookings" className="scroll-mt-24 mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-zinc-900">My bookings</h2>
        <p className="mt-0.5 text-sm text-zinc-600">Table reservations linked to your phone.</p>
        {loadingData ? (
          <div className="mt-6 flex justify-center py-6">
            <Loader2 className="size-6 animate-spin text-emerald-600" aria-hidden />
          </div>
        ) : bookings.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No bookings yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {bookings.slice(0, 12).map((b) => (
              <li key={b.id} className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm">
                <p className="font-semibold text-zinc-900">
                  {b.date} at {b.time}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Table {b.tableNumber || "—"} · {b.guests} guests · {b.status}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="scroll-mt-24 mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Wallet</p>
            <p className="mt-1 inline-flex items-center gap-2 text-xl font-bold text-zinc-900">
              <Wallet className="size-5 text-emerald-600" />
              {formatCustomerMoney(summary.walletBalance)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">Stored value for quick checkout.</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Reward Points</p>
            <p className="mt-1 text-xl font-bold text-zinc-900">{summary.rewardPoints}</p>
            <p className="mt-1 text-xs text-zinc-500">Earn more points on every order.</p>
          </div>
        </div>
      </section>

      <section className="scroll-mt-24 mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-zinc-900">Favorite items</h2>
        <p className="mt-0.5 text-sm text-zinc-600">Based on your recent order history.</p>
        {summary.favorites.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">No favorites yet. Order a few items to build your list.</p>
        ) : (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {summary.favorites.map((f) => (
              <li key={f.name} className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm">
                <span className="inline-flex items-center gap-2 font-medium text-zinc-900">
                  <Heart className="size-4 text-rose-500" />
                  {f.name}
                </span>
                <span className="text-xs text-zinc-500">{f.count}x</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="scroll-mt-24 mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-zinc-900">Saved addresses</h2>
        <p className="mt-0.5 text-sm text-zinc-600">Delivery addresses used in your past orders.</p>
        {summary.savedAddresses.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">No saved addresses yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {summary.savedAddresses.map((address) => (
              <li key={address} className="inline-flex w-full items-start gap-2 rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                <span>{address}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="profile" className="scroll-mt-24 mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Profile</h2>
            <p className="mt-0.5 text-sm text-zinc-600">Update how we address you and contact you.</p>
          </div>
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            className="text-sm font-semibold text-emerald-700 hover:underline"
          >
            {profileOpen ? "Close" : "Edit"}
          </button>
        </div>

        {!profileOpen ? (
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="text-zinc-500">Name</dt>
              <dd className="font-medium text-zinc-900">{authUser.name || "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Phone</dt>
              <dd className="font-medium text-zinc-900">{authUser.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Email</dt>
              <dd className="font-medium text-zinc-900">{authUser.email || "—"}</dd>
            </div>
          </dl>
        ) : (
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-600">Name</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600">Email</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <p className="text-xs text-zinc-500">Phone is verified via OTP login and cannot be changed here.</p>
            <button
              type="button"
              disabled={savingProfile}
              onClick={saveProfile}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-zinc-950 hover:bg-emerald-400 disabled:opacity-60"
            >
              {savingProfile ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Save changes
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
