"use client";

import CustomerAccountLayout, {
  normalizeAccountSection,
} from "@/components/customer/CustomerAccountLayout";
import CustomerProfileAvatar from "@/components/customer/CustomerProfileAvatar";
import { useCustomer } from "@/context/CustomerContext";
import { useCustomerLocale } from "@/context/CustomerLocaleContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { formatCustomerMoney } from "@/lib/customerCurrency";
import { dedupeSavedAddresses } from "@/lib/customerSavedAddresses";
import { pointsToDiscount } from "@/lib/customerRewardsUtils";
import {
  orderStatusBadgeClass,
  reservationStatusBadgeClass,
  formatReservationStatusLabel,
} from "@/lib/customerStatusStyles";
import { isValidEmail } from "@/lib/customerFormValidation";
import { customerClasses, customerPage } from "@/lib/customerTheme";
import { useCustomerMotion } from "@/hooks/useCustomerMotion";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  ChevronRight,
  Heart,
  Info,
  Loader2,
  MapPin,
  Package,
  ShoppingBag,
  Star,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

function splitName(full) {
  const parts = String(full ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function joinName(first, last) {
  return [first, last].map((s) => String(s ?? "").trim()).filter(Boolean).join(" ");
}

function displayName(u) {
  if (!u) return "Customer";
  if (u.name?.trim()) return u.name.trim();
  if (u.email) return u.email.split("@")[0];
  return u.phone || "Customer";
}

function ProfileSummaryCard({ user, orderCount, walletBalance, rewardPoints, link, onAvatarUploaded, onAvatarError }) {
  const statLinks = {
    Wallet: link("/account/dashboard?section=transactions"),
    Points: link("/account/dashboard?section=transactions"),
    Orders: link("/account/dashboard?section=orders"),
  };

  return (
    <div className="ct-account-card ct-account-summary">
      <div className="ct-account-summary__head">
        <CustomerProfileAvatar
          name={displayName(user)}
          avatarUrl={user?.avatarUrl}
          size="xl"
          editable
          onUploaded={onAvatarUploaded}
          onError={onAvatarError}
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-poppins text-lg font-bold text-customer-text sm:text-xl">
            {displayName(user)}
          </h1>
          <p className="mt-0.5 text-xs text-customer-muted">Customer account</p>
          <p className="mt-1 text-[11px] text-customer-muted">Tap the camera icon to update your photo</p>
        </div>
      </div>

      <div className="ct-account-summary__stats">
        {[
          { label: "Wallet", value: formatCustomerMoney(walletBalance), icon: Wallet },
          { label: "Points", value: rewardPoints, icon: Star },
          { label: "Orders", value: orderCount, icon: Package },
        ].map(({ label, value, icon: Icon }) => (
          <Link
            key={label}
            href={statLinks[label]}
            className="ct-account-summary__stat ct-account-summary__stat--link"
          >
            <Icon className="size-4 text-customer-primary" aria-hidden />
            <p className="font-poppins text-sm font-bold text-customer-text">{value}</p>
            <p className="text-[10px] uppercase tracking-wide text-customer-muted">{label}</p>
          </Link>
        ))}
      </div>

      <dl className="ct-account-summary__details">
        <div>
          <dt>Phone</dt>
          <dd>{user?.phone || "—"}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd className="break-all">{user?.email || "—"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt>Address</dt>
          <dd>{user?.address?.trim() || "—"}</dd>
        </div>
      </dl>
      <p className="ct-account-summary__note">
        Earn 1 reward point per ₹10 on completed orders
      </p>
    </div>
  );
}

function TransactionsPanel({ orders, walletBalance, rewardPoints, formatDateTime, link }) {
  const totalSpent = orders.reduce((sum, o) => sum + Number(o.total ?? 0), 0);
  const pointsWorth = pointsToDiscount(rewardPoints);

  return (
    <>
      <div className="ct-account-info-banner">
        <Info className="size-4 shrink-0 text-customer-primary" aria-hidden />
        <div className="min-w-0 text-sm leading-relaxed text-customer-text">
          <p className="font-medium">What is this page?</p>
          <p className="mt-1 text-customer-muted">
            Here you see your <strong className="font-semibold text-customer-text">wallet money</strong>,{" "}
            <strong className="font-semibold text-customer-text">loyalty points</strong>, and how much you{" "}
            <strong className="font-semibold text-customer-text">paid</strong> for each order.
          </p>
          <p className="mt-2 text-xs text-customer-muted">
            Order status (preparing, delivered, etc.) is on{" "}
            <Link href={link("/account/dashboard?section=orders")} className="font-semibold text-customer-primary hover:underline">
              My Orders
            </Link>
            — not here.
          </p>
        </div>
      </div>

      <div className="ct-account-card">
        <div className="ct-account-card__header">
          <h2 className="font-poppins text-base font-bold text-customer-text">Your balance</h2>
          <p className="mt-0.5 text-xs text-customer-muted">Use wallet and points when you checkout online</p>
        </div>

        <div className="ct-account-balance-list">
          <div className="ct-account-balance-item">
            <span className="ct-account-balance-item__icon" aria-hidden>
              <Wallet className="size-5 text-customer-primary" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="ct-account-balance-item__value">{formatCustomerMoney(walletBalance)}</p>
              <p className="ct-account-balance-item__label">Wallet balance</p>
              <p className="ct-account-balance-item__desc">
                Store credit from the restaurant. If you have balance, it can be used at checkout.
              </p>
            </div>
          </div>

          <div className="ct-account-balance-item">
            <span className="ct-account-balance-item__icon" aria-hidden>
              <Star className="size-5 text-customer-primary" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="ct-account-balance-item__value">
                {rewardPoints}{" "}
                <span className="text-sm font-semibold text-customer-muted">
                  (≈ {formatCustomerMoney(pointsWorth)} off)
                </span>
              </p>
              <p className="ct-account-balance-item__label">Reward points</p>
              <p className="ct-account-balance-item__desc">
                You earn 1 point for every ₹10 on completed orders. 1 point = ₹1 discount at checkout.
              </p>
              {rewardPoints > 0 ? (
                <Link
                  href={link("/order/menu")}
                  className="mt-2 inline-block text-xs font-semibold text-customer-primary hover:underline"
                >
                  Order now to use points →
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {orders.length > 0 ? (
          <div className="ct-account-tx-summary">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-customer-muted">Total spent</p>
              <p className="mt-0.5 font-poppins text-lg font-bold text-customer-text">
                {formatCustomerMoney(totalSpent)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-customer-muted">Orders</p>
              <p className="mt-0.5 font-poppins text-lg font-bold text-customer-text">{orders.length}</p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="ct-account-card">
        <div className="ct-account-card__header">
          <h2 className="font-poppins text-base font-bold text-customer-text">Payment history</h2>
          <p className="mt-0.5 text-xs text-customer-muted">
            Amount paid for each order — tap a row to open order details
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
            <ShoppingBag className="size-10 text-customer-primary/30" />
            <p className="text-sm text-customer-muted">No payments yet. Your first order will show here.</p>
            <Link href={link("/order/menu")} className={`${customerClasses.btnPrimary} px-5 py-2.5 text-xs`}>
              Browse menu
            </Link>
          </div>
        ) : (
          <ul className="ct-account-tx-list">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={link(`/account/orders/${o.id}`)} className="ct-account-tx-row">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-customer-muted">You paid</p>
                    <p className="font-poppins text-base font-bold text-customer-text">
                      {formatCustomerMoney(Number(o.total ?? 0))}
                    </p>
                    <p className="mt-1 truncate text-xs text-customer-muted">
                      {o.orderId} · {formatDateTime(o.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className={orderStatusBadgeClass(o.statusKey)}>
                      {o.statusEmoji} {o.statusLabel ?? o.status}
                    </span>
                    <span className="flex items-center gap-0.5 text-xs font-medium text-customer-primary">
                      Details <ChevronRight className="size-3.5" aria-hidden />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function CustomerDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const motionFx = useCustomerMotion();
  const { authUser, authLoading, refreshAuth, patchAuthUser, showToast, cart } = useCustomer();
  const { formatDateTime, formatReservationSlot } = useCustomerLocale();
  const { link } = useRestaurantSlug();

  const sectionParam = searchParams.get("section") ?? searchParams.get("tab");
  const activeSection = normalizeAccountSection(sectionParam);

  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [summary, setSummary] = useState({
    favorites: [],
    savedAddresses: [],
    rewardPoints: 0,
    walletBalance: 0,
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [reorderingId, setReorderingId] = useState("");

  useEffect(() => {
    const legacyTab = searchParams.get("tab");
    if (!legacyTab || searchParams.get("section")) return;
    const section = normalizeAccountSection(legacyTab);
    const base = link("/account/dashboard");
    router.replace(section === "profile" ? base : `${base}?section=${section}`);
  }, [searchParams, router, link]);

  useEffect(() => {
    if (!authLoading && !authUser) router.replace(link("/account/login"));
  }, [authLoading, authUser, router, link]);

  useEffect(() => {
    if (!authUser) return;
    const { first, last } = splitName(authUser.name);
    setFirstName(first);
    setLastName(last);
    setEditEmail(authUser.email ?? "");
    setEditAddress(authUser.address ?? "");
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
          savedAddresses: Array.isArray(summaryData.summary.savedAddresses)
            ? summaryData.summary.savedAddresses
            : [],
          rewardPoints: Number(summaryData.summary.rewardPoints ?? authUser.rewardPoints ?? 0),
          walletBalance: Number(summaryData.summary.walletBalance ?? authUser.walletBalance ?? 0),
        });
      }
      setLoadingData(false);
    }
    loadData();
  }, [authUser]);

  const walletBalance = summary.walletBalance ?? authUser?.walletBalance ?? 0;
  const rewardPoints = summary.rewardPoints ?? authUser?.rewardPoints ?? 0;

  const reorder = async (orderId) => {
    setReorderingId(orderId);
    try {
      const res = await fetch(`/api/customer/orders/${orderId}/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefillOnly: true }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        showToast(data?.error ?? "Could not reorder.", "error");
        return;
      }
      for (const item of data.items ?? []) {
        cart.addItem({ ...item, image: null, itemType: null, prepTime: null });
      }
      showToast("Items added to cart.");
      router.push(link("/order/cart"));
    } catch {
      showToast("Network error.", "error");
    } finally {
      setReorderingId("");
    }
  };

  const cancelBooking = async (bookingId) => {
    try {
      const res = await fetch(`/api/customer/reservations/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        showToast(data?.error ?? "Could not cancel.", "error");
        return;
      }
      showToast(data.message ?? "Booking cancelled.");
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b)));
    } catch {
      showToast("Network error.", "error");
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    const trimmedEmail = editEmail.trim().toLowerCase();
    if (trimmedEmail && !isValidEmail(trimmedEmail)) {
      showToast("Please enter a valid email.", "error");
      return;
    }
    if (!firstName.trim()) {
      showToast("First name is required.", "error");
      return;
    }
    setSavingProfile(true);
    try {
      const res = await fetch("/api/customer/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: joinName(firstName, lastName),
          email: trimmedEmail,
          address: editAddress,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        showToast(data?.error ?? "Could not save.", "error");
        return;
      }
      await refreshAuth();
      showToast("Profile updated.");
    } catch {
      showToast("Network error.", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const profileUser = useMemo(
    () => ({
      ...authUser,
      address: editAddress || authUser?.address,
    }),
    [authUser, editAddress],
  );

  const savedOrderAddresses = useMemo(
    () => dedupeSavedAddresses(summary.savedAddresses, authUser?.address ?? editAddress),
    [summary.savedAddresses, authUser?.address, editAddress],
  );

  if (authLoading || (!authUser && !authLoading)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-customer-primary" />
      </div>
    );
  }

  return (
    <CustomerAccountLayout
      activeSection={activeSection}
      orderCount={orders.length}
      reservationCount={bookings.length}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          {...motionFx.sectionFade}
          className="ct-account-content"
        >
          {activeSection === "profile" && (
            <>
              <ProfileSummaryCard
                user={profileUser}
                orderCount={orders.length}
                walletBalance={walletBalance}
                rewardPoints={rewardPoints}
                link={link}
                onAvatarUploaded={(user) => {
                  if (user) patchAuthUser(user);
                  else refreshAuth();
                  showToast("Profile photo updated.");
                }}
                onAvatarError={(msg) => showToast(msg, "error")}
              />

              <div className="ct-account-card">
                <div className="ct-account-card__header">
                  <h2 className="font-poppins text-base font-bold text-customer-text">Edit your profile</h2>
                  <p className="text-xs text-customer-muted">Update your personal details</p>
                </div>
                <form className="ct-account-form" onSubmit={saveProfile}>
                  <div className="ct-account-form__row">
                    <div className="ct-account-field">
                      <label htmlFor="profile-first" className={customerPage.label}>
                        First name <span className="text-customer-primary">*</span>
                      </label>
                      <input
                        id="profile-first"
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className={customerClasses.field}
                        autoComplete="given-name"
                      />
                    </div>
                    <div className="ct-account-field">
                      <label htmlFor="profile-last" className={customerPage.label}>
                        Last name
                      </label>
                      <input
                        id="profile-last"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className={customerClasses.field}
                        autoComplete="family-name"
                      />
                    </div>
                  </div>

                  <div className="ct-account-form__row">
                    <div className="ct-account-field">
                      <label htmlFor="profile-email" className={customerPage.label}>
                        Email
                      </label>
                      <input
                        id="profile-email"
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className={customerClasses.field}
                        autoComplete="email"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div className="ct-account-field">
                      <label htmlFor="profile-phone" className={customerPage.label}>
                        Phone <span className="text-[10px] font-normal normal-case text-customer-muted">(verified)</span>
                      </label>
                      <input
                        id="profile-phone"
                        type="text"
                        readOnly
                        disabled
                        value={authUser.phone || "Not linked"}
                        className={`${customerClasses.field} ct-field--readonly`}
                        aria-describedby="profile-phone-hint"
                      />
                    </div>
                  </div>

                  <div className="ct-account-field">
                    <label htmlFor="profile-address" className={customerPage.label}>
                      Address
                    </label>
                    <textarea
                      id="profile-address"
                      rows={3}
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className={`${customerClasses.field} min-h-[5.5rem] resize-y`}
                      placeholder="Street, city, area"
                    />
                  </div>

                  <div className="ct-account-form__footer">
                    <p id="profile-phone-hint" className="ct-account-form__hint">
                      Phone is verified via OTP and cannot be changed here.
                    </p>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={savingProfile}
                      className={`${customerClasses.btnPrimary} ct-account-form__submit py-3 text-sm disabled:opacity-60`}
                    >
                      {savingProfile ? <Loader2 className="size-4 animate-spin" /> : "Save changes"}
                    </motion.button>
                  </div>
                </form>
              </div>

              {savedOrderAddresses.length > 0 && (
                <div className="ct-account-card">
                  <div className="ct-account-card__header">
                    <h2 className="font-poppins text-base font-bold text-customer-text">Recent delivery addresses</h2>
                    <p className="mt-0.5 text-xs text-customer-muted">From your past orders — edit your main address above</p>
                  </div>
                  <ul className="ct-account-address-list">
                    {savedOrderAddresses.map((addr) => (
                      <li key={addr} className="ct-account-address-item">
                        <MapPin className="size-4 shrink-0 text-customer-primary" aria-hidden />
                        <span>{addr}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.favorites.length > 0 && (
                <div className="ct-account-card">
                  <div className="ct-account-card__header">
                    <h2 className="font-poppins text-base font-bold text-customer-text">Favorite items</h2>
                  </div>
                  <ul className="divide-y divide-customer-border">
                    {summary.favorites.map((f) => (
                      <li key={f.name} className="flex items-center justify-between px-5 py-3">
                        <span className="flex items-center gap-2 text-sm font-medium text-customer-text">
                          <Heart className="size-4 text-customer-primary" />
                          {f.name}
                        </span>
                        <span className="text-xs font-bold text-customer-primary">{f.count}x</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {activeSection === "orders" && (
            <div className="ct-account-card">
              {loadingData ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="size-6 animate-spin text-customer-primary" />
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <ShoppingBag className="size-10 text-customer-primary/30" />
                  <p className="text-sm text-customer-muted">No orders yet.</p>
                  <Link href={link("/order/menu")} className={`${customerClasses.btnPrimary} px-5 py-2.5 text-xs`}>
                    Browse menu
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-customer-border">
                  {orders.map((o) => (
                    <li
                      key={o.id}
                      className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5"
                    >
                      <Link
                        href={link(`/account/orders/${o.id}`)}
                        className="flex min-w-0 flex-1 items-start gap-3 sm:items-center"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="break-all font-semibold text-customer-text">{o.orderId}</span>
                            <span className={orderStatusBadgeClass(o.statusKey)}>
                              {o.statusEmoji} {o.statusLabel ?? o.status}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-customer-muted">
                            {[o.orderTypeLabel, formatDateTime(o.createdAt)].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        <span className="shrink-0 font-bold text-customer-text">
                          {formatCustomerMoney(Number(o.total ?? 0))}
                        </span>
                      </Link>
                      <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => reorder(o.id)}
                          disabled={reorderingId === o.id}
                          className="min-h-[40px] rounded-lg border border-customer-border px-3 py-2 text-xs font-semibold text-customer-primary hover:bg-customer-primary/8 disabled:opacity-50"
                        >
                          {reorderingId === o.id ? "..." : "Reorder"}
                        </button>
                        <Link
                          href={link(`/account/orders/${o.id}`)}
                          className="flex min-h-[40px] min-w-[40px] items-center justify-center text-customer-muted"
                          aria-label="View order"
                        >
                          <ChevronRight className="size-5" />
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {activeSection === "reservations" && (
            <div className="ct-account-card">
              {loadingData ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="size-6 animate-spin text-customer-primary" />
                </div>
              ) : bookings.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <Calendar className="size-10 text-customer-primary/30" />
                  <p className="text-sm text-customer-muted">No reservations yet.</p>
                  <Link
                    href={link("/order/table-booking")}
                    className={`${customerClasses.btnPrimary} px-5 py-2.5 text-xs`}
                  >
                    Book a table
                  </Link>
                </div>
              ) : (
                <ul className="ct-account-booking-list">
                  {bookings.slice(0, 20).map((b) => {
                    const canCancel = b.status !== "cancelled" && b.status !== "completed";
                    return (
                      <li key={b.id} className="ct-account-booking-row">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-customer-text">
                            {formatReservationSlot(b.date, b.time)}
                          </p>
                          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-customer-muted">
                            <span>Table {b.tableNumber || "—"}</span>
                            <span aria-hidden>·</span>
                            <span>{b.guests} guests</span>
                            <span className={reservationStatusBadgeClass(b.status)}>
                              {formatReservationStatusLabel(b.status)}
                            </span>
                          </p>
                        </div>
                        {canCancel ? (
                          <button
                            type="button"
                            onClick={() => cancelBooking(b.id)}
                            className={`shrink-0 text-xs font-semibold hover:underline ${customerClasses.textDanger}`}
                          >
                            Cancel
                          </button>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {activeSection === "transactions" && (
            <>
              {loadingData ? (
                <div className="ct-account-card flex justify-center py-12">
                  <Loader2 className="size-6 animate-spin text-customer-primary" />
                </div>
              ) : (
                <TransactionsPanel
                  orders={orders}
                  walletBalance={walletBalance}
                  rewardPoints={rewardPoints}
                  formatDateTime={formatDateTime}
                  link={link}
                />
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </CustomerAccountLayout>
  );
}

export default function CustomerDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-customer-primary" />
        </div>
      }
    >
      <CustomerDashboardContent />
    </Suspense>
  );
}
