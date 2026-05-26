"use client";

import StripePaymentModal from "@/components/payments/StripePaymentModal";
import Modal from "@/components/ui/Modal";
import { useCustomer } from "@/context/CustomerContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { calcOrderTotals, useCheckoutMeta } from "@/hooks/useCheckoutMeta";
import { formatCustomerMoney } from "@/lib/customerCurrency";
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
  netBanking: "Net Banking",
  wallet: "Wallet",
  payLater: "Pay Later",
  bankTransfer: "Bank Transfer",
};

function Field({ label, required, children }) {
  return (
    <div>
      <label className={customerPage.label}>
        {label}{required && <span className="ml-0.5 text-red-400">*</span>}
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
  const { tax, delivery: deliveryCharge, total, taxRate } = calcOrderTotals({
    subtotal,
    orderType,
    taxPercentage: checkoutMeta.taxPercentage,
    deliveryCharge: checkoutMeta.deliveryCharge,
    couponDiscount,
  });
  const etaLabel = checkoutMeta.etaMinutes?.[orderType] ?? "20-30";
  const enabledPaymentMethods = useMemo(() => {
    const pm = checkoutMeta.paymentMethods ?? {};
    return Object.keys(PAYMENT_LABEL).filter((key) => Boolean(pm[key]));
  }, [checkoutMeta.paymentMethods]);
  const TypeIcon = orderType ? TYPE_ICON[orderType] : null;

  async function loadRazorpayScript() {
    if (typeof window === "undefined") return false;
    if (window.Razorpay) return true;
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

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
          className="rounded-xl gradient-primary px-7 py-3 text-sm font-bold text-white shadow-lg shadow-[var(--customer-primary-shadow)]/25"
        >
          Select Order Type
        </motion.button>
      </motion.div>
    );
  }

  if (lines.length === 0) return null;

  const placeOrder = async () => {
    if (!authUser) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!customer.name.trim()) {
      showToast("Name is required.", "error");
      return;
    }
    const phoneOk = customer.phone.trim().length > 0;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(customer.email ?? "").trim());
    if (!phoneOk && !emailOk) {
      showToast("Please add a phone number or a valid email for contact.", "error");
      return;
    }
    if (orderType === "delivery" && !customer.address.trim()) {
      showToast("Delivery address is required.", "error"); return;
    }
    if (orderType === "dine-in" && !customer.tableNumber.trim()) {
      showToast("Table number is required.", "error"); return;
    }
    if (!enabledPaymentMethods.includes(paymentMethod)) {
      showToast("Selected payment method is not available.", "error");
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
            phone: customer.phone.trim(),
            email: customer.email.trim(),
            address: customer.address.trim(),
            tableNumber: customer.tableNumber.trim(),
          },
          paymentMethod,
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

      if (payment?.gatewayProvider === "razorpay" && payment?.checkout?.orderId) {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          showToast("Could not load payment gateway. Try again.", "error");
          return;
        }
        setPaying(true);
        const options = {
          key: payment.checkout.key,
          amount: payment.checkout.amount,
          currency: payment.checkout.currency,
          name: "Restaurant Management System",
          description: `Order ${createdOrderId}`,
          order_id: payment.checkout.orderId,
          prefill: {
            name: customer.name.trim(),
            email: customer.email.trim(),
            contact: customer.phone.trim(),
          },
          handler: async (response) => {
            const confirm = await confirmPayment(createdOrderId, "razorpay", response);
            if (confirm?.success) {
              finishSuccess(createdOrderId);
            } else {
              showToast(confirm?.error || "Payment confirmation failed.", "error");
            }
            setPaying(false);
          },
          modal: {
            ondismiss: () => {
              setPaying(false);
              showToast("Payment cancelled.", "error");
            },
          },
          theme: { color: "var(--customer-primary)" },
        };
        const rz = new window.Razorpay(options);
        rz.on("payment.failed", () => {
          setPaying(false);
          showToast("Payment failed. Please retry.", "error");
        });
        rz.open();
        return;
      }

      if (payment?.gatewayProvider === "stripe" && payment?.checkout?.clientSecret) {
        const publishableKey = payment.checkout.publishableKey || "";
        if (!publishableKey) {
          showToast(
            "Stripe publishable key missing. Add it under Super Admin → Payment settings.",
            "error"
          );
          return;
        }
        setPaying(true);
        setStripeCheckout({
          orderId: createdOrderId,
          clientSecret: payment.checkout.clientSecret,
          publishableKey,
        });
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
    const normalized = otpPhone.replace(/\s|-/g, "");
    if (!/^\+?[0-9]{8,15}$/.test(normalized)) {
      setOtpError("Please enter a valid mobile number.");
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
    <div className="ct-page-shell">
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
              className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-800">
              Login required to complete checkout.{" "}
              <button type="button" onClick={() => setIsAuthModalOpen(true)}
                className="font-bold text-customer-primary underline underline-offset-2 hover:text-[#E85A24]">
                Login with OTP
              </button>
            </motion.div>
          ) : null}

          {/* Order type */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="flex items-center justify-between ct-surface-card px-4 py-3.5 shadow-sm">
            <div className="flex items-center gap-2.5">
              {TypeIcon && <TypeIcon className="size-4 text-customer-primary" />}
              <span className="font-poppins text-sm font-bold text-customer-text">{TYPE_LABEL[orderType]}</span>
            </div>
            <button type="button" onClick={() => setOrderTypeModalOpen(true)}
              className="rounded-full border border-customer-border px-3.5 py-1.5 text-xs font-semibold text-customer-muted transition-colors hover:border-customer-primary/30 hover:text-customer-primary">
              Change
            </button>
          </motion.div>

          {/* Customer details */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="ct-surface-card rounded-3xl p-6 shadow-sm">
            <h2 className="mb-1 font-poppins text-lg font-black text-customer-text">Your Details</h2>
            <p className="mb-5 text-xs text-customer-muted">
              <span className="text-red-400">*</span> Name required. Phone <strong>or</strong> Email required.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name" required>
                <input value={customer.name} onChange={(e) => updateCustomer({ name: e.target.value })} placeholder="Your name" className={inputCls} />
              </Field>
              <Field label="Phone">
                <input
                  value={customer.phone}
                  onChange={(e) => updateCustomer({ phone: e.target.value })}
                  placeholder="+1 555 000 0000"
                  className={inputCls}
                  inputMode="tel"
                  autoComplete="tel"
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={customer.email}
                  onChange={(e) => updateCustomer({ email: e.target.value })}
                  placeholder="you@example.com"
                  className={inputCls}
                  autoComplete="email"
                />
              </Field>
              {orderType === "dine-in" && (
                <Field label="Table Number" required>
                  <input value={customer.tableNumber} onChange={(e) => updateCustomer({ tableNumber: e.target.value })} placeholder="e.g. T04" className={inputCls} />
                </Field>
              )}
              {orderType === "delivery" && (
                <div className="sm:col-span-2">
                  <Field label="Delivery Address" required>
                    <textarea rows={2} value={customer.address} onChange={(e) => updateCustomer({ address: e.target.value })} placeholder="Full delivery address" className={`${inputCls} resize-none`} />
                  </Field>
                </div>
              )}
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
            className="ct-surface-card rounded-3xl p-6 shadow-sm">
            <h2 className="mb-5 font-poppins text-lg font-black text-customer-text">Payment Method</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {enabledPaymentMethods.map((methodKey) => (
                <motion.button key={methodKey} whileTap={{ scale: 0.97 }} type="button"
                  onClick={() => setPaymentMethod(methodKey)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-all ${
                    paymentMethod === methodKey
                      ? "border-customer-primary/40 bg-customer-primary/8 text-customer-primary shadow-sm"
                      : "border-customer-border bg-white text-customer-muted hover:border-customer-primary/30 hover:text-customer-text"
                  }`}>
                  {PAYMENT_LABEL[methodKey] ?? methodKey}
                </motion.button>
              ))}
            </div>
            {!enabledPaymentMethods.length && <p className="mt-3 text-xs text-red-500">No payment method enabled.</p>}
            {checkoutMeta.onlinePaymentsAvailable === false && (
              <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                Card/UPI needs <strong>Stripe</strong> or <strong>Razorpay</strong>. Cash on delivery works.
              </p>
            )}
          </motion.div>
        </div>

        {/* ── Order summary ── */}
        <div className="lg:col-span-1">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
            className="ct-surface-card overflow-hidden rounded-3xl shadow-sm lg:sticky lg:top-24">
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
              <div className="flex gap-2">
                <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Coupon code"
                  className={`${customerClasses.field} rounded-full py-2 text-xs`} />
                <button type="button" onClick={applyCoupon}
                  className="rounded-full border border-customer-border px-4 py-2 text-xs font-semibold text-customer-muted hover:border-customer-primary/30 hover:text-customer-primary">
                  Apply
                </button>
              </div>
              <div className="flex justify-between text-customer-muted"><span>Subtotal</span><span className="font-semibold text-customer-text">{formatCustomerMoney(subtotal)}</span></div>
              <div className="flex justify-between text-customer-muted"><span>Tax ({taxRate.toFixed(2)}%)</span><span className="font-semibold text-customer-text">{formatCustomerMoney(tax)}</span></div>
              {orderType === "delivery" && <div className="flex justify-between text-customer-muted"><span>Delivery</span><span className="font-semibold text-customer-text">{formatCustomerMoney(deliveryCharge)}</span></div>}
              {appliedCoupon && <div className="flex justify-between text-green-600"><span>Coupon ({appliedCoupon.code})</span><span>- {formatCustomerMoney(couponDiscount)}</span></div>}
              <div className="flex justify-between border-t border-customer-border pt-3 font-poppins text-base font-black text-customer-text">
                <span>Total</span><span className="text-customer-primary">{formatCustomerMoney(total)}</span>
              </div>
              <div className="flex justify-between text-xs text-customer-muted">
                <span>Payment</span><span className="font-semibold text-customer-text">{PAYMENT_LABEL[paymentMethod] ?? paymentMethod}</span>
              </div>
            </div>
            <button type="button" onClick={placeOrder} disabled={loading || authLoading || paying}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full gradient-primary py-3.5 text-sm font-bold text-white shadow-lg shadow-[var(--customer-primary-shadow)]/25 transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? <><Loader2 className="size-4 animate-spin" /> Placing Order…</>
                : paying ? <><Loader2 className="size-4 animate-spin" /> Processing…</>
                : authLoading ? "Checking login..."
                : authUser ? `Place Order · ${formatCustomerMoney(total)}`
                : "Login to Continue"}
            </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>

      <Modal open={isAuthModalOpen} onClose={() => { setIsAuthModalOpen(false); setOtpStep("phone"); setOtpError(""); }} title="Login to continue checkout">
        <div className="space-y-4">
          {otpError && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{otpError}</p>}
          {otpDevHint && <p className="rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/8 px-3 py-2 text-xs text-[#92400E]">{otpDevHint}</p>}
          {otpStep === "phone" ? (
            <>
              <p className="text-sm text-customer-muted">Enter mobile number to receive OTP.</p>
              <input value={otpPhone} onChange={(e) => setOtpPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="+1 555 000 0000"
                className="w-full rounded-xl border border-customer-border bg-white px-3 py-3 text-sm text-customer-text outline-none focus:border-customer-primary/50 focus:ring-2 focus:ring-[var(--customer-primary)]/10" />
              <button type="button" disabled={otpLoading} onClick={requestOtp}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-3 text-sm font-semibold text-white shadow-md disabled:opacity-50">
                {otpLoading ? <Loader2 className="size-4 animate-spin" /> : <Phone className="size-4" />} Send OTP
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-customer-muted">6-digit code sent to <span className="font-semibold text-customer-text">{otpPhone}</span>.</p>
              <div className="flex items-center justify-between gap-2">
                {otpDigits.map((digit, idx) => (
                  <input key={idx} ref={(el) => { otpRefs.current[idx] = el; }} value={digit}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) otpRefs.current[idx - 1]?.focus(); }}
                    inputMode="numeric" maxLength={1}
                    className="h-12 w-11 rounded-xl border border-customer-border bg-white text-center text-lg font-bold text-customer-text outline-none focus:border-customer-primary/50 focus:ring-2 focus:ring-[var(--customer-primary)]/10" />
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-3 text-sm font-semibold text-white shadow-md disabled:opacity-50">
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
              ? `${window.location.origin}/order/success?id=${encodeURIComponent(stripeCheckout.orderId)}`
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
    </div>
  );
}
