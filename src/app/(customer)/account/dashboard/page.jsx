"use client";

import { useCustomer } from "@/context/CustomerContext";
import { useCustomerLocale } from "@/context/CustomerLocaleContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { formatCustomerMoney } from "@/lib/customerCurrency";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, ChevronRight, Heart, Loader2, LogOut,
  MapPin, ShoppingBag, UserRound, Wallet, Star,
  Package, Edit3, Check, X
} from "lucide-react";
import { orderStatusBadgeClass } from "@/lib/customerStatusStyles";
import { customerClasses } from "@/lib/customerTheme";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function displayName(u) {
  if (!u) return "Customer";
  if (u.name?.trim()) return u.name.trim();
  if (u.email) return u.email.split("@")[0];
  return u.phone || "Customer";
}

const VALID_TABS = new Set(["orders", "bookings", "favorites", "profile"]);

function CustomerDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authUser, authLoading, refreshAuth, logoutCustomer, showToast, cart } = useCustomer();
  const { formatDateTime, formatReservationSlot } = useCustomerLocale();
  const { link } = useRestaurantSlug();
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [summary, setSummary] = useState({ favorites: [], savedAddresses: [], rewardPoints: 0, walletBalance: 0 });
  const [reorderingId, setReorderingId] = useState("");
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(() => (VALID_TABS.has(tabParam) ? tabParam : "orders"));

  useEffect(() => {
    if (tabParam && VALID_TABS.has(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  useEffect(() => {
    if (!authLoading && !authUser) router.replace(link("/account/login"));
  }, [authLoading, authUser, router, link]);

  useEffect(() => {
    if (authUser) { setEditName(authUser.name ?? ""); setEditEmail(authUser.email ?? ""); }
  }, [authUser]);

  useEffect(() => {
    async function loadData() {
      if (!authUser) return;
      setLoadingData(true);
      const [ordersRes, bookingsRes, summaryRes] = await Promise.all([
        fetch("/api/customer/orders", { cache: "no-store" }),
        fetch("/api/customer/auth/bookings", { cache: "no-store" }),
        fetch("/api/customer/dashboard/summary", { cache: "no-store" }),
      ]);
      const [ordersData, bookingsData, summaryData] = await Promise.all([
        ordersRes.json().catch(() => ({ success: false, orders: [] })),
        bookingsRes.json().catch(() => ({ success: false, bookings: [] })),
        summaryRes.json().catch(() => ({ success: false, summary: null })),
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
      const res = await fetch(`/api/customer/orders/${orderId}/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefillOnly: true }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) { showToast(data?.error ?? "Could not reorder.", "error"); return; }
      for (const item of data.items ?? []) {
        cart.addItem({ ...item, image: null, itemType: null, prepTime: null });
      }
      showToast("Items added to cart.");
      router.push(link("/order/cart"));
    } catch { showToast("Network error.", "error"); }
    finally { setReorderingId(""); }
  };

  const cancelBooking = async (bookingId) => {
    try {
      const res = await fetch(`/api/customer/reservations/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) { showToast(data?.error ?? "Could not cancel.", "error"); return; }
      showToast(data.message ?? "Booking cancelled.");
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b)));
    } catch { showToast("Network error.", "error"); }
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
      if (!res.ok || !data?.success) { showToast(data?.error ?? "Could not save.", "error"); return; }
      await refreshAuth();
      showToast("Profile saved.");
      setProfileOpen(false);
    } catch { showToast("Network error.", "error"); }
    finally { setSavingProfile(false); }
  };

  if (authLoading || (!authUser && !authLoading)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-customer-primary" />
      </div>
    );
  }

  const TABS = [
    { id: "orders",    label: "Orders",    icon: ShoppingBag, count: orders.length },
    { id: "bookings",  label: "Bookings",  icon: Calendar,    count: bookings.length },
    { id: "favorites", label: "Favorites", icon: Heart,       count: summary.favorites.length },
    { id: "profile",   label: "Profile",   icon: UserRound,   count: null },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">

      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 overflow-hidden ct-surface-card rounded-3xl"
      >
        <div className="h-1.5 gradient-primary" />
        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-2xl gradient-primary">
              <span className="font-poppins text-xl font-bold text-white">
                {displayName(authUser)[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-xs text-customer-muted">Welcome back</p>
              <h1 className="font-poppins text-xl font-bold text-customer-text">{displayName(authUser)}</h1>
              <p className="text-xs text-customer-muted">{authUser.phone || authUser.email || ""}</p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={async () => { await logoutCustomer(); router.push(link("/account/login")); }}
            className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium ${customerClasses.alertError}`}
          >
            <LogOut className="size-4" /> Log out
          </motion.button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x divide-customer-border border-t border-customer-border">
          {[
            { label: "Orders", value: orders.length, icon: Package },
            { label: "Wallet", value: formatCustomerMoney(summary.walletBalance), icon: Wallet },
            { label: "Points", value: summary.rewardPoints, icon: Star },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex min-w-0 flex-col items-center gap-1 px-1 py-3">
              <Icon className="size-4 text-customer-primary" />
              <p className="max-w-full truncate font-poppins text-sm font-bold text-customer-text sm:text-base">{value}</p>
              <p className="text-[10px] text-customer-muted">{label}</p>
            </div>
          ))}
        </div>
        <p className="border-t border-customer-border px-4 py-2 text-center text-[10px] text-customer-muted">
          Earn 1 reward point per ₹10 on completed orders
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {TABS.map((tab) => (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex min-h-[44px] cursor-pointer shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? "gradient-primary text-white"
                : "border border-customer-border bg-[var(--customer-card)] text-customer-muted hover:border-customer-primary/30"
            }`}
          >
            <tab.icon className="size-3.5" />
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-customer-primary/10 text-customer-primary"}`}>
                {tab.count}
              </span>
            )}
          </motion.button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >

          {/* ORDERS */}
          {activeTab === "orders" && (
            <div className="ct-surface-card rounded-2xl">
              <div className="border-b border-customer-border px-5 py-4">
                <h2 className="font-poppins text-base font-bold text-customer-text">Order History</h2>
                <p className="text-xs text-customer-muted">Track status for recent orders</p>
              </div>
              {loadingData ? (
                <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-customer-primary" /></div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <ShoppingBag className="size-10 text-customer-primary/30" />
                  <p className="text-sm text-customer-muted">No orders yet.</p>
                  <Link href={link("/order/menu")} className={`${customerClasses.btnPrimary} px-5 py-2.5 text-xs`}>
                    Browse Menu
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-customer-border">
                  {orders.map((o) => (
                    <li key={o.id} className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-customer-cream sm:flex-row sm:items-center sm:gap-2 sm:px-5">
                      <Link href={link(`/account/orders/${o.id}`)} className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="break-all font-poppins font-semibold text-customer-text">{o.orderId}</span>
                            <span className={orderStatusBadgeClass(o.statusKey)}>
                              {o.statusEmoji} {o.statusLabel ?? o.status}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-customer-muted">{formatDateTime(o.createdAt)}</p>
                        </div>
                        <span className="shrink-0 font-poppins font-bold text-customer-text">
                          {formatCustomerMoney(Number(o.total ?? 0))}
                        </span>
                      </Link>
                      <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => reorder(o.id)}
                          disabled={reorderingId === o.id}
                          className="min-h-[44px] rounded-lg border border-customer-border px-3 py-2 text-xs font-semibold text-customer-primary transition-colors hover:bg-customer-primary/8 disabled:opacity-50"
                        >
                          {reorderingId === o.id ? "..." : "Reorder"}
                        </button>
                        <Link href={link(`/account/orders/${o.id}`)} className="flex min-h-[44px] min-w-[44px] items-center justify-center text-customer-muted" aria-label="View order">
                          <ChevronRight className="size-5" />
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* BOOKINGS */}
          {activeTab === "bookings" && (
            <div className="ct-surface-card rounded-2xl">
              <div className="border-b border-customer-border px-5 py-4">
                <h2 className="font-poppins text-base font-bold text-customer-text">My Bookings</h2>
                <p className="text-xs text-customer-muted">Table reservations linked to your phone</p>
              </div>
              {loadingData ? (
                <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-customer-primary" /></div>
              ) : bookings.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <Calendar className="size-10 text-customer-primary/30" />
                  <p className="text-sm text-customer-muted">No bookings yet.</p>
                  <Link href={link("/order/table-booking")} className={`${customerClasses.btnPrimary} px-5 py-2.5 text-xs`}>
                    Book a Table
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-customer-border">
                  {bookings.slice(0, 12).map((b) => (
                    <li key={b.id} className="flex items-start justify-between gap-3 px-5 py-4">
                      <div>
                        <p className="font-poppins font-semibold text-customer-text">{formatReservationSlot(b.date, b.time)}</p>
                        <p className="mt-0.5 text-xs text-customer-muted">Table {b.tableNumber || "—"} · {b.guests} guests · <span className="capitalize">{b.status}</span></p>
                      </div>
                      {b.status !== "cancelled" && b.status !== "completed" && (
                        <button type="button" onClick={() => cancelBooking(b.id)} className={`shrink-0 text-xs font-semibold hover:underline ${customerClasses.textDanger}`}>
                          Cancel
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* FAVORITES */}
          {activeTab === "favorites" && (
            <div className="ct-surface-card rounded-2xl">
              <div className="border-b border-customer-border px-5 py-4">
                <h2 className="font-poppins text-base font-bold text-customer-text">Favorite Items</h2>
                <p className="text-xs text-customer-muted">Based on your order history</p>
              </div>
              {summary.favorites.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <Heart className="size-10 text-customer-primary/30" />
                  <p className="text-sm text-customer-muted">Order a few items to build your favorites list.</p>
                </div>
              ) : (
                <ul className="divide-y divide-customer-border">
                  {summary.favorites.map((f) => (
                    <li key={f.name} className="flex items-center justify-between px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 items-center justify-center rounded-xl bg-customer-primary/10">
                          <Heart className="size-4 text-customer-primary" />
                        </div>
                        <span className="font-medium text-customer-text">{f.name}</span>
                      </div>
                      <span className="rounded-full bg-customer-primary/10 px-2.5 py-1 text-xs font-bold text-customer-primary">{f.count}x</span>
                    </li>
                  ))}
                </ul>
              )}
              {summary.savedAddresses.length > 0 && (
                <div className="border-t border-customer-border px-5 py-4">
                  <p className="mb-3 font-poppins text-sm font-bold text-customer-text">Saved Addresses</p>
                  <ul className="space-y-2">
                    {summary.savedAddresses.map((addr) => (
                      <li key={addr} className="flex items-start gap-2 text-sm text-customer-muted">
                        <MapPin className="mt-0.5 size-4 shrink-0 text-customer-primary" />
                        <span>{addr}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* PROFILE */}
          {activeTab === "profile" && (
            <div className="ct-surface-card rounded-2xl">
              <div className="flex items-center justify-between border-b border-customer-border px-5 py-4">
                <div>
                  <h2 className="font-poppins text-base font-bold text-customer-text">Profile</h2>
                  <p className="text-xs text-customer-muted">Update your personal details</p>
                </div>
                <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={() => setProfileOpen((v) => !v)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-customer-border px-3 py-2 text-xs font-semibold text-customer-primary transition-colors hover:bg-customer-primary/8">
                  <Edit3 className="size-3.5" /> {profileOpen ? "Cancel" : "Edit"}
                </motion.button>
              </div>

              <div className="p-5">
                {!profileOpen ? (
                  <dl className="space-y-3 text-sm">
                    {[
                      { label: "Name",  value: authUser.name  || "—" },
                      { label: "Phone", value: authUser.phone || "—" },
                      { label: "Email", value: authUser.email || "—" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex flex-col gap-1 rounded-xl bg-customer-cream px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                        <dt className="shrink-0 text-xs font-semibold uppercase tracking-wider text-customer-muted">{label}</dt>
                        <dd className="min-w-0 break-words font-medium text-customer-text sm:max-w-[65%] sm:text-right">{value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <div className="space-y-3">
                    {[
                      { label: "Name",  value: editName,  setter: setEditName,  type: "text",  placeholder: "Your name" },
                      { label: "Email", value: editEmail, setter: setEditEmail, type: "email", placeholder: "you@example.com" },
                    ].map(({ label, value, setter, type, placeholder }) => (
                      <div key={label}>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-customer-muted">{label}</label>
                        <input type={type} value={value} onChange={(e) => setter(e.target.value)} placeholder={placeholder}
                          className="w-full rounded-xl border border-customer-border bg-[var(--customer-card)] px-3.5 py-3 text-sm text-customer-text outline-none focus:border-customer-primary/50 focus:ring-2 focus:ring-[var(--customer-primary)]/10" />
                      </div>
                    ))}
                    <p className="text-xs text-customer-muted">Phone is verified via OTP and cannot be changed here.</p>
                    <div className="flex gap-2">
                      <motion.button whileTap={{ scale: 0.97 }} type="button" disabled={savingProfile} onClick={saveProfile}
                        className={`${customerClasses.btnPrimary} flex-1 py-3 text-sm disabled:opacity-60`}>
                        {savingProfile ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                        Save Changes
                      </motion.button>
                      <button type="button" onClick={() => setProfileOpen(false)}
                        className="flex size-12 items-center justify-center rounded-xl border border-customer-border text-customer-muted hover:bg-customer-cream">
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function CustomerDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-customer-primary" />
      </div>
    }>
      <CustomerDashboardContent />
    </Suspense>
  );
}
