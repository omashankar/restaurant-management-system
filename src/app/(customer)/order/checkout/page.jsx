"use client";

import CustomerMobileInput from "@/components/customer/CustomerMobileInput";
import StripePaymentModal from "@/components/payments/StripePaymentModal";
import Modal from "@/components/ui/Modal";
import { useCustomer } from "@/context/CustomerContext";
import { useRestaurantInfo } from "@/hooks/useRestaurantInfo";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { BHOJDESK_BRAND } from "@/config/bhojdeskBrand";
import { calcOrderTotals, useCheckoutMeta } from "@/hooks/useCheckoutMeta";
import {
  isValidGuestName,
  isValidEmail,
  validateCheckoutContact,
} from "@/lib/customerFormValidation";
import { formatCustomerMoney } from "@/lib/customerCurrency";
import {
  loadRazorpayScript,
  openRazorpayCheckout,
  startGatewayCheckout,
} from "@/lib/gatewayCheckoutClient";
import { normalizePhoneForOtp } from "@/lib/phoneUtils";
import { customerClasses, customerPage, customerType } from "@/lib/customerTheme";
import { motion, AnimatePresence } from "framer-motion";
import { Bike, ConciergeBell, Loader2, Phone, Store, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const TYPE_LABEL = { "dine-in": "Dine-In", takeaway: "Takeaway", delivery: "Delivery" };
const TYPE_ICON  = { "dine-in": Store, takeaway: ConciergeBell, delivery: Bike };
const OTP_TTL_SEC = 120;
const PAYMENT_LABEL = {
  cod: "Cash on Delivery",
  cashCounter: "Cash at Counter",
  upi: "UPI",
  card: "Card",
  debitCard: "Debit Card",
  netBanking: "Net Banking",
  wallet: "Wallet",
  payLater: "Pay Later",
  bankTransfer: "Bank Transfer",
};

const ONLINE_PAYMENT_METHODS = [
  "upi",
  "card",
  "debitCard",
  "netBanking",
  "wallet",
  "payLater",
  "bankTransfer",
];

function Field({ label, required, children }) {
  return (
    <div>
      <label className={customerPage.label}>
        {label}{required && <span className={`ml-0.5 ${customerClasses.textDanger}`}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = customerClasses.field;

export default function CheckoutPage() {
  const {
    cart,
    orderType,
    customer,
    updateCustomer,
    showToast,
    setOrderTypeModalOpen,
    authUser,
    authLoading,
    refreshAuth,
  } = useCustomer();
  const router = useRouter();
  const { link } = useRestaurantSlug();
  const { info: restaurantInfo } = useRestaurantInfo();
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [stripeCheckout, setStripeCheckout] = useState(null);
  const [notes, setNotes] = useState("");
  const { meta: checkoutMeta } = useCheckoutMeta();
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [otpPhone, setOtpPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpStep, setOtpStep] = useState("phone");
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpDevHint, setOtpDevHint] = useState("");
  const otpRefs = useRef([]);
  const [availableTables, setAvailableTables] = useState([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [rewardPoints, setRewardPoints] = useState(0);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [scheduleFor, setScheduleFor] = useState("asap");
  const [offlineCheckout, setOfflineCheckout] = useState(null);

  const { lines, subtotal, clearCart } = cart;
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === "percent") {
      const raw = (subtotal * Number(appliedCoupon.value ?? 0)) / 100;
      const max = Number(appliedCoupon.maxDiscount ?? raw);
      return Math.min(raw, max);
    }
    return Number(appliedCoupon.value ?? 0);
  }, [appliedCoupon, subtotal]);
  const effectivePoints = Math.min(Math.max(0, pointsToRedeem), rewardPoints);
  const { tax, delivery: deliveryCharge, total, taxRate, pointsDiscount } = calcOrderTotals({
    subtotal,
    orderType,
    taxPercentage: checkoutMeta.taxPercentage,
    deliveryCharge: checkoutMeta.deliveryCharge,
    couponDiscount,
    pointsDiscount: effectivePoints,
  });
  const minOrderAmount = Number(checkoutMeta.minOrderAmount ?? 0);
  const etaLabel = checkoutMeta.etaMinutes?.[orderType] ?? "20-30";
  const enabledPaymentMethods = useMemo(() => {
    const pm = checkoutMeta.paymentMethods ?? {};
    return Object.keys(PAYMENT_LABEL).filter((key) => Boolean(pm[key]));
  }, [checkoutMeta.paymentMethods]);
  const TypeIcon = orderType ? TYPE_ICON[orderType] : null;

  async function confirmPayment(orderId, provider, payload) {
    const res = await fetch("/api/customer/orders/confirm-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, provider, ...payload }),
    });
    return res.json();
  }

  function finishSuccess(orderId) {
    clearCart();
    showToast("Order placed successfully.");
    router.push(link(`/order/success?id=${encodeURIComponent(orderId)}`));
  }

  // Redirect to menu if cart is empty — must be in useEffect, not during render
  useEffect(() => {
    if (lines.length === 0) {
      router.replace(link("/order/menu"));
    }
  }, [lines.length, router, link]);

  /** Keep selected method valid after checkout-meta loads (e.g. online methods off without gateway). */
  useEffect(() => {
    const pm = checkoutMeta.paymentMethods ?? {};
    const enabled = Object.keys(PAYMENT_LABEL).filter((key) => Boolean(pm[key]));
    setPaymentMethod((current) => {
      if (enabled.includes(current)) return current;
      const d = String(pm.defaultMethod ?? "cod");
      if (enabled.includes(d)) return d;
      return enabled[0] ?? "cod";
    });
  }, [checkoutMeta.paymentMethods]);

  useEffect(() => {
    if (otpCooldown <= 0) return undefined;
    const t = setInterval(() => {
      setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [otpCooldown]);

  // Load available dine-in tables for dropdown selection
  useEffect(() => {
    if (orderType !== "dine-in") {
      setAvailableTables([]);
      setTablesLoading(false);
      return;
    }
    let cancelled = false;
    setTablesLoading(true);
    fetch("/api/customer/tables?status=available", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data?.tables) ? data.tables : [];
        setAvailableTables(list);
      })
      .catch(() => {
        if (!cancelled) setAvailableTables([]);
      })
      .finally(() => {
        if (!cancelled) setTablesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderType]);

  useEffect(() => {
    if (!authUser) {
      setRewardPoints(0);
      setSavedAddresses([]);
      return;
    }
    fetch("/api/customer/dashboard/summary", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data.summary) {
          setRewardPoints(Number(data.summary.rewardPoints ?? 0));
          setSavedAddresses(Array.isArray(data.summary.savedAddresses) ? data.summary.savedAddresses : []);
        }
      })
      .catch(() => {});
  }, [authUser]);

  if (!orderType) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 text-center"
      >
        <div className="flex size-20 items-center justify-center rounded-3xl bg-customer-cream">
          <ShoppingBag className="size-10 text-customer-primary/40" />
        </div>
        <div>
          <p className="font-poppins text-lg font-bold text-customer-text">No Order Type Selected</p>
          <p className="mt-1 text-sm text-customer-muted">Please select how you&apos;d like to order first.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={() => setOrderTypeModalOpen(true)}
          className={`${customerClasses.btnPrimary} px-7 py-3 text-sm`}
        >
          Select Order Type
        </motion.button>
      </motion.div>
    );
  }

  if (lines.length === 0) return null;

  const placeOrder = async () => {
    if (!isValidGuestName(customer.name)) {
      showToast("Please enter a valid full name (at least 2 letters).", "error");
      return;
    }
    const contact = validateCheckoutContact({
      phone: customer.phone,
      email: customer.email,
    });
    if (!contact.ok) {
      showToast(contact.error, "error");
      return;
    }
    if (orderType === "delivery") {
      const addr = customer.address.trim();
      if (addr.length < 10) {
        showToast("Please enter a complete delivery address (at least 10 characters).", "error");
        return;
      }
    }
    if (orderType === "dine-in" && !customer.tableNumber.trim()) {
      showToast("Table number is required.", "error"); return;
    }
    if (!enabledPaymentMethods.includes(paymentMethod)) {
      showToast("Selected payment method is not available.", "error");
      return;
    }
    if (orderType === "delivery" && minOrderAmount > 0 && subtotal < minOrderAmount) {
      showToast(`Minimum order for delivery is ${formatCustomerMoney(minOrderAmount)}.`, "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/customer/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType,
          notes: notes.trim() || undefined,
          items: lines.map((l) => ({
            id: l.id,
            name: l.name,
            price: l.price,
            qty: l.qty,
          })),
          customer: {
            name: customer.name.trim(),
            phone: contact.phoneE164 || customer.phone.trim(),
            email: contact.email || customer.email.trim(),
            address: customer.address.trim(),
            tableNumber: customer.tableNumber.trim(),
          },
          paymentMethod,
          couponCode: appliedCoupon?.code ?? undefined,
          pointsRedeemed: pointsToRedeem > 0 ? pointsToRedeem : undefined,
          scheduleFor: scheduleFor !== "asap" ? scheduleFor : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        showToast(data?.error ?? "Failed to place order.", "error");
        return;
      }
      const createdOrderId = data.order?.orderId;
      const payment = data.order?.payment;
      if (!createdOrderId) {
        showToast("Order created but missing order id.", "error");
        return;
      }

      if (payment?.gatewayProvider && payment?.checkout) {
        setPaying(true);
        const launched = startGatewayCheckout(payment, {
          onRazorpay: async (checkout) => {
            const loaded = await loadRazorpayScript();
            if (!loaded) {
              setPaying(false);
              showToast("Could not load payment gateway. Try again.", "error");
              return;
            }
            openRazorpayCheckout({
              checkout,
              options: {
                name: restaurantInfo?.name?.trim() || BHOJDESK_BRAND.fullName,
                description: `Order ${createdOrderId}`,
                prefill: {
                  name: customer.name.trim(),
                  email: customer.email.trim(),
                  contact: contact.phoneE164 || customer.phone.trim(),
                },
                theme: { color: "var(--customer-primary)" },
              },
              onSuccess: async (response) => {
                const confirm = await confirmPayment(createdOrderId, "razorpay", response);
                if (confirm?.success) finishSuccess(createdOrderId);
                else showToast(confirm?.error || "Payment confirmation failed.", "error");
                setPaying(false);
              },
              onError: () => {
                setPaying(false);
                showToast("Payment failed. Please retry.", "error");
              },
              onDismiss: () => {
                setPaying(false);
                showToast("Payment cancelled.", "error");
              },
            });
          },
          onStripe: (checkout) => {
            const publishableKey = checkout.publishableKey || "";
            if (!publishableKey) {
              setPaying(false);
              showToast("Stripe publishable key missing in payment settings.", "error");
              return;
            }
            setStripeCheckout({
              orderId: createdOrderId,
              clientSecret: checkout.clientSecret,
              publishableKey,
            });
          },
          onOffline: (checkout) => {
            setPaying(false);
            setOfflineCheckout({ orderId: createdOrderId, ...checkout });
          },
          onPaytmComplete: async () => {
            const confirm = await confirmPayment(createdOrderId, "paytm", {});
            if (confirm?.success) finishSuccess(createdOrderId);
            else showToast(confirm?.error || "Payment confirmation failed.", "error");
            setPaying(false);
          },
          onError: (msg) => {
            setPaying(false);
            showToast(msg || "Could not start payment.", "error");
          },
        });
        if (launched) return;
      }

      if (ONLINE_PAYMENT_METHODS.includes(paymentMethod)) {
        showToast("Online payment could not be started. Try cash on delivery or contact the restaurant.", "error");
        return;
      }

      finishSuccess(createdOrderId);
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    const found = (checkoutMeta.coupons ?? []).find((c) => c.code === code);
    if (!found) {
      showToast("Invalid coupon code.", "error");
      setAppliedCoupon(null);
      return;
    }
    if (found.minSubtotal && subtotal < Number(found.minSubtotal)) {
      showToast(`Coupon valid on minimum ${formatCustomerMoney(Number(found.minSubtotal))} subtotal.`, "error");
      setAppliedCoupon(null);
      return;
    }
    setAppliedCoupon(found);
    showToast(`Coupon ${found.code} applied.`);
  };

  const requestOtp = async () => {
    const normalized = normalizePhoneForOtp(otpPhone);
    if (!normalized) {
      setOtpError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    setOtpDevHint("");
    try {
      const res = await fetch("/api/customer/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setOtpError(data?.error ?? "Could not send OTP.");
        return;
      }
      setOtpPhone(normalized);
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpStep("verify");
      setOtpCooldown(OTP_TTL_SEC);
      if (data.devOtp) setOtpDevHint(`Dev OTP: ${data.devOtp}`);
      setTimeout(() => otpRefs.current[0]?.focus(), 0);
    } catch {
      setOtpError("Network error. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpDigitChange = (index, value) => {
    const next = value.replace(/\D/g, "").slice(-1);
    setOtpDigits((prev) => {
      const copy = [...prev];
      copy[index] = next;
      return copy;
    });
    if (next && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const verifyOtp = async () => {
    const otp = otpDigits.join("");
    if (otp.length !== 6) {
      setOtpError("Enter the 6-digit code.");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    try {
      const res = await fetch("/api/customer/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: otpPhone, otp }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setOtpError(data?.error ?? "OTP verification failed.");
        return;
      }
      await refreshAuth();
      setIsAuthModalOpen(false);
      showToast("Login successful. Continue checkout.");
    } catch {
      setOtpError("Network error. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const resendOtp = async () => {
    if (otpCooldown > 0 || !otpPhone) return;
    await requestOtp();
  };

  return (
    <div className="ct-page-shell pb-28 lg:pb-0">
      {/* Hero */}
      <div className="ct-page-header">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <Link href={link("/order/cart")} className="text-sm text-customer-muted transition-colors hover:text-customer-primary">← Cart</Link>
            <span className="hidden text-customer-border sm:inline">/</span>
            <h1 className={`${customerType.heroTitle} text-2xl sm:text-3xl`}>Checkout</h1>
          </div>
          <p className="mt-1 text-sm text-customer-muted">Complete your details to place order securely.</p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

      <div className="grid gap-6 lg:grid-cols-3">

        {/* ── Form ── */}
        <div className="space-y-5 lg:col-span-2">
          {!authLoading && !authUser ? (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className={`${customerClasses.alertInfo} text-sm`}>
              Guest checkout — enter your details below.{" "}
              <button type="button" onClick={() => setIsAuthModalOpen(true)}
                className="font-bold text-customer-primary underline underline-offset-2">
                Login for rewards & order history
              </button>
            </motion.div>
          ) : null}

          {/* Order type */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="flex items-center justify-between ct-surface-card px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              {TypeIcon && <TypeIcon className="size-4 text-customer-primary" />}
              <span className="font-poppins text-sm font-bold text-customer-text">{TYPE_LABEL[orderType]}</span>
            </div>
            <button type="button" onClick={() => setOrderTypeModalOpen(true)}
              className="min-h-[44px] rounded-full border border-customer-border px-4 py-2 text-xs font-semibold text-customer-muted transition-colors hover:border-customer-primary/30 hover:text-customer-primary">
              Change
            </button>
          </motion.div>

          {/* Customer details */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="ct-surface-card rounded-3xl p-6">
            <h2 className="mb-1 font-poppins text-lg font-black text-customer-text">Your Details</h2>
            <p className="mb-5 text-xs text-customer-muted">
              <span className={customerClasses.textDanger}>*</span> Name required. Phone <strong>or</strong> Email required.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name" required>
                <input
                  value={customer.name}
                  onChange={(e) => updateCustomer({ name: e.target.value })}
                  placeholder="Your name"
                  className={inputCls}
                  autoComplete="name"
                />
                {customer.name.trim() && !isValidGuestName(customer.name) ? (
                  <p className={`mt-1 text-[11px] ${customerClasses.textDanger}`}>Use at least 2 letters (not numbers only).</p>
                ) : null}
              </Field>
              <CustomerMobileInput
                id="checkout-mobile"
                label="Mobile number"
                value={customer.phone}
                onChange={(digits) => updateCustomer({ phone: digits })}
                labelClassName={customerPage.label}
                className="sm:col-span-1"
              />
              <Field label="Email">
                <input
                  type="email"
                  value={customer.email}
                  onChange={(e) => updateCustomer({ email: e.target.value })}
                  placeholder="you@example.com"
                  className={inputCls}
                  autoComplete="email"
                />
                {customer.email.trim() && !isValidEmail(customer.email) ? (
                  <p className={`mt-1 text-[11px] ${customerClasses.textDanger}`}>Enter a valid email address.</p>
                ) : null}
              </Field>
              {orderType === "dine-in" && (
                <Field label="Table Number" required>
                  {availableTables.length > 0 ? (
                    <select
                      value={customer.tableNumber}
                      onChange={(e) => updateCustomer({ tableNumber: String(e.target.value).trim().toUpperCase() })}
                      className={`${inputCls} cursor-pointer`}
                      disabled={tablesLoading}
                    >
                      <option value="">
                        {tablesLoading ? "Loading tables…" : "Select your table"}
                      </option>
                      {availableTables.map((t) => (
                        <option key={t.id ?? t.tableNumber} value={t.tableNumber}>
                          {t.tableNumber}
                          {t.capacity ? ` (Seats ${t.capacity})` : ""}
                          {t.zone ? ` · ${t.zone}` : ""}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-2">
                      <input
                        value={customer.tableNumber}
                        onChange={(e) => updateCustomer({ tableNumber: String(e.target.value).trim().toUpperCase() })}
                        placeholder={tablesLoading ? "Loading tables…" : "e.g. T04"}
                        className={inputCls}
                        disabled={tablesLoading}
                      />
                      <p className="text-[11px] text-customer-muted">
                        Table list not available yet — please type the table number shown on your table.
                      </p>
                    </div>
                  )}
                </Field>
              )}
              {orderType === "delivery" && (
                <div className="sm:col-span-2 space-y-3">
                  {savedAddresses.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {savedAddresses.map((addr) => (
                        <button
                          key={addr}
                          type="button"
                          onClick={() => updateCustomer({ address: addr })}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium ${customer.address === addr ? "border-customer-primary bg-customer-primary/10 text-customer-primary" : "border-customer-border text-customer-muted"}`}
                        >
                          {addr.length > 40 ? `${addr.slice(0, 40)}…` : addr}
                        </button>
                      ))}
                    </div>
                  )}
                  <Field label="Delivery Address" required>
                    <textarea rows={2} value={customer.address} onChange={(e) => updateCustomer({ address: e.target.value })} placeholder="Full delivery address" className={`${inputCls} resize-none`} />
                  </Field>
                  {minOrderAmount > 0 && subtotal < minOrderAmount && (
                    <p className={`${customerClasses.alertWarning} text-xs`}>Minimum delivery order: {formatCustomerMoney(minOrderAmount)}</p>
                  )}
                </div>
              )}
              <div className="sm:col-span-2">
                <Field label="When do you want it?">
                  <select value={scheduleFor} onChange={(e) => setScheduleFor(e.target.value)} className={`${inputCls} cursor-pointer`}>
                    <option value="asap">As soon as possible</option>
                    <option value="30min">In ~30 minutes</option>
                    <option value="1hr">In ~1 hour</option>
                    <option value="2hr">In ~2 hours</option>
                  </select>
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Special Cooking Instructions">
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="No onion, less spicy, etc."
                    className={`${inputCls} resize-none`}
                  />
                </Field>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="ct-surface-card rounded-3xl p-6">
            <h2 className="mb-5 font-poppins text-lg font-black text-customer-text">Payment Method</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {enabledPaymentMethods.map((methodKey) => (
                <motion.button key={methodKey} whileTap={{ scale: 0.97 }} type="button"
                  onClick={() => setPaymentMethod(methodKey)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-all ${
                    paymentMethod === methodKey
                      ? "border-customer-primary/40 bg-customer-primary/8 text-customer-primary"
                      : "border-customer-border bg-[var(--customer-card)] text-customer-muted hover:border-customer-primary/30 hover:text-customer-text"
                  }`}>
                  {PAYMENT_LABEL[methodKey] ?? methodKey}
                </motion.button>
              ))}
            </div>
            {!enabledPaymentMethods.length && <p className={`mt-3 text-xs ${customerClasses.textDanger}`}>No payment method enabled.</p>}
            {checkoutMeta.onlinePaymentsAvailable === false && (
              <p className={`mt-3 ${customerClasses.alertWarning} text-xs`}>
                Card/UPI needs <strong>Stripe</strong> or <strong>Razorpay</strong>. Cash on delivery works.
              </p>
            )}
          </motion.div>
        </div>

        {/* ── Order summary ── */}
        <div className="lg:col-span-1">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
            className="ct-surface-card overflow-hidden rounded-3xl lg:sticky lg:top-24">
            <div className="h-1 gradient-primary" />
            <div className="p-6">
            <h2 className="mb-5 font-poppins text-lg font-black text-customer-text">Order Summary</h2>
            <ul className="space-y-2.5">
              {lines.map((l) => (
                <li key={l.id} className="flex items-start justify-between gap-2 text-sm">
                  <span className="text-customer-muted">{l.qty}× <span className="font-semibold text-customer-text">{l.name}</span></span>
                  <span className="shrink-0 font-bold text-customer-text">{formatCustomerMoney(l.price * l.qty)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 space-y-2.5 border-t border-customer-border pt-5 text-sm">
              <p className="text-xs text-customer-muted">Est. time: <span className="font-bold text-customer-text">{etaLabel} mins</span></p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Coupon code"
                  className={`${customerClasses.field} min-w-0 flex-1 rounded-full py-2.5 text-xs`} />
                <button type="button" onClick={applyCoupon}
                  className="min-h-[44px] rounded-full border border-customer-border px-4 py-2.5 text-xs font-semibold text-customer-muted hover:border-customer-primary/30 hover:text-customer-primary sm:shrink-0">
                  Apply
                </button>
              </div>
              <div className="flex justify-between text-customer-muted"><span>Subtotal</span><span className="font-semibold text-customer-text">{formatCustomerMoney(subtotal)}</span></div>
              {taxRate > 0 && (
                <div className="flex justify-between text-customer-muted">
                  <span>Tax ({taxRate.toFixed(2)}%)</span>
                  <span className="font-semibold text-customer-text">{formatCustomerMoney(tax)}</span>
                </div>
              )}
              {orderType === "delivery" && <div className="flex justify-between text-customer-muted"><span>Delivery</span><span className="font-semibold text-customer-text">{formatCustomerMoney(deliveryCharge)}</span></div>}
              {appliedCoupon && <div className={`flex justify-between ${customerClasses.textSuccess}`}><span>Coupon ({appliedCoupon.code})</span><span>- {formatCustomerMoney(couponDiscount)}</span></div>}
              {pointsDiscount > 0 && <div className={`flex justify-between ${customerClasses.textSuccess}`}><span>Points redeemed</span><span>- {formatCustomerMoney(pointsDiscount)}</span></div>}
              {authUser && rewardPoints > 0 && (
                <div className="rounded-xl border border-customer-border bg-customer-cream/50 p-3">
                  <div className="flex items-center justify-between text-xs text-customer-muted">
                    <span>Reward points ({rewardPoints} available)</span>
                    <span>- {formatCustomerMoney(pointsDiscount)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.min(rewardPoints, Math.floor(subtotal * 0.5))}
                    value={pointsToRedeem}
                    onChange={(e) => setPointsToRedeem(Number(e.target.value))}
                    className="mt-2 w-full accent-[var(--customer-primary)]"
                  />
                  <p className="mt-1 text-[10px] text-customer-muted">Redeem up to 50% of subtotal (1 point = ₹1)</p>
                </div>
              )}
              <div className="flex justify-between border-t border-customer-border pt-3 font-poppins text-base font-black text-customer-text">
                <span>Total</span><span className="text-customer-primary">{formatCustomerMoney(total)}</span>
              </div>
              <div className="flex justify-between text-xs text-customer-muted">
                <span>Payment</span><span className="font-semibold text-customer-text">{PAYMENT_LABEL[paymentMethod] ?? paymentMethod}</span>
              </div>
            </div>
            <button type="button" onClick={placeOrder} disabled={loading || paying}
              className={`mt-5 hidden gap-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 lg:flex ${customerClasses.btnPrimaryLg}`}>
              {loading ? <><Loader2 className="size-4 animate-spin" /> Placing Order…</>
                : paying ? <><Loader2 className="size-4 animate-spin" /> Processing…</>
                : `Place Order · ${formatCustomerMoney(total)}`}
            </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>

      {/* Mobile sticky checkout CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-customer-border bg-[var(--customer-card)]/95 p-4 backdrop-blur-sm pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden">
        <button
          type="button"
          onClick={placeOrder}
          disabled={loading || paying}
          className={`${customerClasses.btnPrimaryLg} w-full gap-2 text-sm disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {loading ? <><Loader2 className="size-4 animate-spin" /> Placing Order…</>
            : paying ? <><Loader2 className="size-4 animate-spin" /> Processing…</>
            : `Place Order · ${formatCustomerMoney(total)}`}
        </button>
      </div>

      <Modal open={isAuthModalOpen} onClose={() => { setIsAuthModalOpen(false); setOtpStep("phone"); setOtpError(""); }} title="Login to continue checkout">
        <div className="space-y-4">
          {otpError && <p className={`${customerClasses.alertError} text-xs`}>{otpError}</p>}
          {otpDevHint && <p className={`${customerClasses.alertWarning} text-xs`}>{otpDevHint}</p>}
          {otpStep === "phone" ? (
            <>
              <p className="text-sm text-customer-muted">Enter mobile number to receive OTP.</p>
              <CustomerMobileInput
                id="checkout-otp-mobile"
                label="Mobile number"
                required
                value={otpPhone}
                onChange={setOtpPhone}
                labelClassName="mb-1.5 block text-xs font-semibold text-customer-muted"
              />
              <button type="button" disabled={otpLoading} onClick={requestOtp}
                className={`${customerClasses.btnPrimaryLg} gap-2 text-sm disabled:opacity-50`}>
                {otpLoading ? <Loader2 className="size-4 animate-spin" /> : <Phone className="size-4" />} Send OTP
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-customer-muted">6-digit code sent to <span className="font-semibold text-customer-text">{otpPhone}</span>.</p>
              <div className="flex w-full items-center justify-between gap-1.5 sm:gap-2">
                {otpDigits.map((digit, idx) => (
                  <input key={idx} type="tel" ref={(el) => { otpRefs.current[idx] = el; }} value={digit}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) otpRefs.current[idx - 1]?.focus(); }}
                    inputMode="numeric" maxLength={1}
                    className="h-11 min-w-0 flex-1 max-w-12 rounded-xl border border-customer-border bg-[var(--customer-card)] text-center text-base font-bold text-customer-text outline-none focus:border-customer-primary/50 focus:ring-2 focus:ring-[var(--customer-primary)]/10 sm:h-12 sm:max-w-[3rem] sm:text-lg" />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => setOtpStep("phone")} className="text-xs text-customer-muted hover:text-customer-text">Change number</button>
                <button type="button" disabled={otpCooldown > 0 || otpLoading} onClick={resendOtp}
                  className="text-xs font-semibold text-customer-primary disabled:text-customer-muted">
                  {otpCooldown > 0 ? `Resend in ${Math.floor(otpCooldown / 60)}:${String(otpCooldown % 60).padStart(2, "0")}` : "Resend OTP"}
                </button>
              </div>
              <button type="button" disabled={otpLoading} onClick={verifyOtp}
                className={`${customerClasses.btnPrimaryLg} gap-2 text-sm disabled:opacity-50`}>
                {otpLoading && <Loader2 className="size-4 animate-spin" />} Verify & Continue
              </button>
            </>
          )}
        </div>
      </Modal>

      {stripeCheckout ? (
        <StripePaymentModal
          open={!!stripeCheckout}
          publishableKey={stripeCheckout.publishableKey}
          clientSecret={stripeCheckout.clientSecret}
          title="Pay for your order"
          returnUrl={
            typeof window !== "undefined"
              ? `${window.location.origin}${link(`/order/success?id=${encodeURIComponent(stripeCheckout.orderId)}`)}`
              : ""
          }
          onClose={() => {
            setStripeCheckout(null);
            setPaying(false);
            showToast("Payment cancelled.", "error");
          }}
          onPaid={async (paymentIntentId) => {
            const orderIdSafe = stripeCheckout.orderId;
            const confirm = await confirmPayment(orderIdSafe, "stripe", {
              paymentIntentId,
            });
            setStripeCheckout(null);
            setPaying(false);
            if (confirm?.success) {
              finishSuccess(orderIdSafe);
            } else {
              showToast(confirm?.error || "Payment confirmation failed.", "error");
            }
          }}
        />
      ) : null}

      <Modal
        open={!!offlineCheckout}
        onClose={() => setOfflineCheckout(null)}
        title="Complete bank / UPI transfer"
      >
        {offlineCheckout ? (
          <div className="space-y-4 text-sm text-customer-text">
            {offlineCheckout.instructions ? (
              <p className="whitespace-pre-wrap rounded-xl bg-customer-cream/60 p-3">{offlineCheckout.instructions}</p>
            ) : null}
            {offlineCheckout.upiId ? (
              <p><strong>UPI ID:</strong> {offlineCheckout.upiId}</p>
            ) : null}
            {offlineCheckout.bankDetails ? (
              <p className="whitespace-pre-wrap"><strong>Bank:</strong> {offlineCheckout.bankDetails}</p>
            ) : null}
            <button
              type="button"
              className={`${customerClasses.btnPrimaryLg} w-full text-sm`}
              onClick={async () => {
                const confirm = await confirmPayment(offlineCheckout.orderId, "offline", {});
                setOfflineCheckout(null);
                if (confirm?.success) {
                  showToast(confirm.pending ? "Payment submitted for verification." : "Order placed.");
                  finishSuccess(offlineCheckout.orderId);
                } else {
                  showToast(confirm?.error || "Could not submit payment.", "error");
                }
              }}
            >
              I have paid — submit order
            </button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
