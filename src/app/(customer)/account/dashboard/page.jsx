"use client";

import { useCustomer } from "@/context/CustomerContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { formatCustomerMoney } from "@/lib/customerCurrency";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, ChevronRight, Heart, Loader2, LogOut,
  MapPin, ShoppingBag, UserRound, Wallet, Star,
  Package, Edit3, Check, X
} from "lucide-react";
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
  try { return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }); }
  catch { return "—"; }
}

const STATUS_COLORS = {
  new:        "bg-blue-100 text-blue-700",
  preparing:  "bg-[#F59E0B]/15 text-[#F59E0B]",
  ready:      "bg-[#22C55E]/15 text-[#22C55E]",
  delivered:  "bg-[#22C55E]/15 text-[#22C55E]",
  cancelled:  "bg-red-100 text-red-600",
};

export default function CustomerDashboardPage() {
  const router = useRouter();
  const { authUser, authLoading, refreshAuth, logoutCustomer, showToast } = useCustomer();
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
  const [activeTab, setActiveTab] = useState("orders");

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
      const res = await fetch(`/api/customer/orders/${orderId}/reorder`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data?.success) { showToast(data?.error ?? "Could not reorder.", "error"); return; }
      showToast("Reorder placed successfully.");
      router.push(link(`/order/success?id=${encodeURIComponent(data.order.orderId)}`));
    } catch { showToast("Network error.", "error"); }
    finally { setReorderingId(""); }
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
        <Loader2 className="size-8 animate-spin text-[#FF6B35]" />
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
        className="mb-6 overflow-hidden rounded-3xl border border-[#FFE4D6] bg-white shadow-sm"
      >
        <div className="h-1.5 gradient-primary" />
        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-[#FF6B35]/20">
              <span className="font-poppins text-xl font-bold text-white">
                {displayName(authUser)[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Welcome back</p>
              <h1 className="font-poppins text-xl font-bold text-[#111827]">{displayName(authUser)}</h1>
              <p className="text-xs text-[#6B7280]">{authUser.phone || authUser.email || ""}</p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={async () => { await logoutCustomer(); router.push(link("/account/login")); }}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
          >
            <LogOut className="size-4" /> Log out
          </motion.button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x divide-[#FFE4D6] border-t border-[#FFE4D6]">
          {[
            { label: "Orders", value: orders.length, icon: Package },
            { label: "Wallet", value: formatCustomerMoney(summary.walletBalance), icon: Wallet },
            { label: "Points", value: summary.rewardPoints, icon: Star },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center gap-1 py-3">
              <Icon className="size-4 text-[#FF6B35]" />
              <p className="font-poppins text-base font-bold text-[#111827]">{value}</p>
              <p className="text-[10px] text-[#6B7280]">{label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {TABS.map((tab) => (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? "gradient-primary text-white shadow-md shadow-[#FF6B35]/20"
                : "border border-[#FFE4D6] bg-white text-[#6B7280] hover:border-[#FF6B35]/30"
            }`}
          >
            <tab.icon className="size-3.5" />
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-[#FF6B35]/10 text-[#FF6B35]"}`}>
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
            <div className="rounded-2xl border border-[#FFE4D6] bg-white shadow-sm">
              <div className="border-b border-[#FFE4D6] px-5 py-4">
                <h2 className="font-poppins text-base font-bold text-[#111827]">Order History</h2>
                <p className="text-xs text-[#6B7280]">Track status for recent orders</p>
              </div>
              {loadingData ? (
                <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-[#FF6B35]" /></div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <ShoppingBag className="size-10 text-[#FF6B35]/30" />
                  <p className="text-sm text-[#6B7280]">No orders yet.</p>
                  <Link href={link("/order/menu")} className="rounded-xl gradient-primary px-5 py-2.5 text-xs font-bold text-white shadow-md">
                    Browse Menu
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-[#FFE4D6]">
                  {orders.map((o) => (
                    <li key={o.id}>
                      <Link href={link(`/account/orders/${o.id}`)}
                        className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-[#FFF8F3]">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-poppins font-semibold text-[#111827]">{o.orderId}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[o.statusKey] ?? "bg-[#6B7280]/10 text-[#6B7280]"}`}>
                              {o.statusEmoji} {o.statusLabel ?? o.status}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-[#6B7280]">{formatDate(o.createdAt)}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="font-poppins font-bold text-[#111827]">{formatCustomerMoney(Number(o.total ?? 0))}</span>
                          <button type="button" onClick={(e) => { e.preventDefault(); reorder(o.id); }}
                            disabled={reorderingId === o.id}
                            className="rounded-lg border border-[#FFE4D6] px-2 py-1 text-[11px] font-semibold text-[#FF6B35] transition-colors hover:bg-[#FF6B35]/8 disabled:opacity-50">
                            {reorderingId === o.id ? "..." : "Reorder"}
                          </button>
                          <ChevronRight className="size-4 text-[#6B7280]" />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* BOOKINGS */}
          {activeTab === "bookings" && (
            <div className="rounded-2xl border border-[#FFE4D6] bg-white shadow-sm">
              <div className="border-b border-[#FFE4D6] px-5 py-4">
                <h2 className="font-poppins text-base font-bold text-[#111827]">My Bookings</h2>
                <p className="text-xs text-[#6B7280]">Table reservations linked to your phone</p>
              </div>
              {loadingData ? (
                <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-[#FF6B35]" /></div>
              ) : bookings.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <Calendar className="size-10 text-[#FF6B35]/30" />
                  <p className="text-sm text-[#6B7280]">No bookings yet.</p>
                  <Link href={link("/order/table-booking")} className="rounded-xl gradient-primary px-5 py-2.5 text-xs font-bold text-white shadow-md">
                    Book a Table
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-[#FFE4D6]">
                  {bookings.slice(0, 12).map((b) => (
                    <li key={b.id} className="px-5 py-4">
                      <p className="font-poppins font-semibold text-[#111827]">{b.date} at {b.time}</p>
                      <p className="mt-0.5 text-xs text-[#6B7280]">Table {b.tableNumber || "—"} · {b.guests} guests · <span className="capitalize">{b.status}</span></p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* FAVORITES */}
          {activeTab === "favorites" && (
            <div className="rounded-2xl border border-[#FFE4D6] bg-white shadow-sm">
              <div className="border-b border-[#FFE4D6] px-5 py-4">
                <h2 className="font-poppins text-base font-bold text-[#111827]">Favorite Items</h2>
                <p className="text-xs text-[#6B7280]">Based on your order history</p>
              </div>
              {summary.favorites.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <Heart className="size-10 text-[#FF6B35]/30" />
                  <p className="text-sm text-[#6B7280]">Order a few items to build your favorites list.</p>
                </div>
              ) : (
                <ul className="divide-y divide-[#FFE4D6]">
                  {summary.favorites.map((f) => (
                    <li key={f.name} className="flex items-center justify-between px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 items-center justify-center rounded-xl bg-[#FF6B35]/10">
                          <Heart className="size-4 text-[#FF6B35]" />
                        </div>
                        <span className="font-medium text-[#111827]">{f.name}</span>
                      </div>
                      <span className="rounded-full bg-[#FF6B35]/10 px-2.5 py-1 text-xs font-bold text-[#FF6B35]">{f.count}x</span>
                    </li>
                  ))}
                </ul>
              )}
              {summary.savedAddresses.length > 0 && (
                <div className="border-t border-[#FFE4D6] px-5 py-4">
                  <p className="mb-3 font-poppins text-sm font-bold text-[#111827]">Saved Addresses</p>
                  <ul className="space-y-2">
                    {summary.savedAddresses.map((addr) => (
                      <li key={addr} className="flex items-start gap-2 text-sm text-[#6B7280]">
                        <MapPin className="mt-0.5 size-4 shrink-0 text-[#FF6B35]" />
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
            <div className="rounded-2xl border border-[#FFE4D6] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#FFE4D6] px-5 py-4">
                <div>
                  <h2 className="font-poppins text-base font-bold text-[#111827]">Profile</h2>
                  <p className="text-xs text-[#6B7280]">Update your personal details</p>
                </div>
                <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-1.5 rounded-xl border border-[#FFE4D6] px-3 py-2 text-xs font-semibold text-[#FF6B35] transition-colors hover:bg-[#FF6B35]/8">
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
                      <div key={label} className="flex items-center justify-between rounded-xl bg-[#FFF8F3] px-4 py-3">
                        <dt className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">{label}</dt>
                        <dd className="font-medium text-[#111827]">{value}</dd>
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
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#6B7280]">{label}</label>
                        <input type={type} value={value} onChange={(e) => setter(e.target.value)} placeholder={placeholder}
                          className="w-full rounded-xl border border-[#FFE4D6] bg-white px-3.5 py-3 text-sm text-[#111827] outline-none focus:border-[#FF6B35]/50 focus:ring-2 focus:ring-[#FF6B35]/10" />
                      </div>
                    ))}
                    <p className="text-xs text-[#6B7280]">Phone is verified via OTP and cannot be changed here.</p>
                    <div className="flex gap-2">
                      <motion.button whileTap={{ scale: 0.97 }} type="button" disabled={savingProfile} onClick={saveProfile}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl gradient-primary py-3 text-sm font-bold text-white shadow-md disabled:opacity-60">
                        {savingProfile ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                        Save Changes
                      </motion.button>
                      <button type="button" onClick={() => setProfileOpen(false)}
                        className="flex size-12 items-center justify-center rounded-xl border border-[#FFE4D6] text-[#6B7280] hover:bg-[#FFF8F3]">
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
