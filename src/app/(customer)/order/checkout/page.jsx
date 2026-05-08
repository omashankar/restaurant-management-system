"use client";

import { useCustomer } from "@/context/CustomerContext";
import Modal from "@/components/ui/Modal";
import { Bike, ConciergeBell, Loader2, Phone, Store } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const TYPE_LABEL = { "dine-in": "Dine-In", takeaway: "Takeaway", delivery: "Delivery" };
const TYPE_ICON  = { "dine-in": Store, takeaway: ConciergeBell, delivery: Bike };
const OTP_TTL_SEC = 120;

function Field({ label, required, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}{required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition-all focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15 placeholder:text-zinc-500";

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
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [checkoutMeta, setCheckoutMeta] = useState({
    taxPercentage: 8,
    deliveryCharge: 0,
    etaMinutes: { "dine-in": "15-20", takeaway: "20-30", delivery: "30-45" },
    coupons: [],
  });
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
  const taxRate = Number(checkoutMeta.taxPercentage ?? 8);
  const deliveryCharge =
    orderType === "delivery" ? Number(checkoutMeta.deliveryCharge ?? 0) : 0;
  const tax = subtotal * (taxRate / 100);
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === "percent") {
      const raw = (subtotal * Number(appliedCoupon.value ?? 0)) / 100;
      const max = Number(appliedCoupon.maxDiscount ?? raw);
      return Math.min(raw, max);
    }
    return Number(appliedCoupon.value ?? 0);
  }, [appliedCoupon, subtotal]);
  const total = Math.max(0, subtotal + tax + deliveryCharge - couponDiscount);
  const etaLabel = checkoutMeta.etaMinutes?.[orderType] ?? "20-30";
  const TypeIcon = orderType ? TYPE_ICON[orderType] : null;

  // Redirect to menu if cart is empty — must be in useEffect, not during render
  useEffect(() => {
    if (lines.length === 0) {
      router.replace("/order/menu");
    }
  }, [lines.length, router]);

  useEffect(() => {
    let mounted = true;
    async function loadCheckoutMeta() {
      try {
        const res = await fetch("/api/customer/checkout-meta", { cache: "no-store" });
        const data = await res.json();
        if (!mounted || !res.ok || !data?.success || !data.meta) return;
        setCheckoutMeta((prev) => ({ ...prev, ...data.meta }));
      } catch {
        // keep defaults
      }
    }
    loadCheckoutMeta();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (otpCooldown <= 0) return undefined;
    const t = setInterval(() => {
      setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [otpCooldown]);

  if (!orderType) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 text-center">
        <p className="text-zinc-700">Please select an order type first.</p>
        <button
          type="button"
          onClick={() => setOrderTypeModalOpen(true)}
          className="cursor-pointer rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-zinc-950 hover:bg-emerald-400"
        >
          Select Order Type
        </button>
      </div>
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
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        showToast(data?.error ?? "Failed to place order.", "error");
        return;
      }

      clearCart();
      showToast("Order placed successfully.");
      router.push(`/order/success?id=${encodeURIComponent(data.order.orderId)}`);
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
      showToast(`Coupon valid on minimum $${Number(found.minSubtotal).toFixed(2)} subtotal.`, "error");
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
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-2xl border border-zinc-200 bg-white/85 px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
        <Link href="/order/cart" className="cursor-pointer text-sm text-zinc-500 hover:text-zinc-800">← Cart</Link>
        <span className="text-zinc-400">/</span>
        <h1 className="text-2xl font-bold text-zinc-900">Checkout</h1>
        </div>
        <p className="mt-1 text-xs text-zinc-600">Complete your details to place order securely.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">

        {/* ── Form ── */}
        <div className="space-y-5 lg:col-span-2">
          {!authLoading && !authUser ? (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Checkout complete karne ke liye login required hai.
              {" "}
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="font-semibold underline underline-offset-2 hover:text-amber-900"
              >
                OTP login karein
              </button>
              .
            </div>
          ) : null}

          {/* Order type */}
          <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 shadow-sm">
            <div className="flex items-center gap-2.5">
              {TypeIcon && <TypeIcon className="size-4 text-emerald-600" />}
              <span className="text-sm font-medium text-zinc-900">{TYPE_LABEL[orderType]}</span>
            </div>
            <button
              type="button"
              onClick={() => setOrderTypeModalOpen(true)}
              className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:border-emerald-500/40 hover:text-emerald-700"
            >
              Change
            </button>
          </div>

          {/* Customer details */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-sm font-bold uppercase tracking-wider text-zinc-600">Your Details</h2>
            <p className="mb-4 text-xs text-zinc-500">
              <span className="text-red-400">*</span> Name is required. You must also provide <strong>either</strong> a phone number <strong>or</strong> a valid email.
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
          </div>
        </div>

        {/* ── Order summary ── */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-600">Order Summary</h2>
            <ul className="space-y-2.5">
              {lines.map((l) => (
                <li key={l.id} className="flex items-start justify-between gap-2 text-sm">
                  <span className="text-zinc-600">{l.qty}× <span className="text-zinc-900">{l.name}</span></span>
                  <span className="shrink-0 font-medium text-zinc-900">${(l.price * l.qty).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-2 border-t border-zinc-200 pt-4 text-sm">
              <p className="text-xs text-zinc-500">Estimated time: {etaLabel} mins</p>
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Coupon code"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 hover:border-emerald-500/40 hover:text-emerald-700"
                >
                  Apply
                </button>
              </div>
              <div className="flex justify-between text-zinc-600"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-zinc-600"><span>Tax ({taxRate.toFixed(2)}%)</span><span>${tax.toFixed(2)}</span></div>
              {orderType === "delivery" ? (
                <div className="flex justify-between text-zinc-600"><span>Delivery</span><span>${deliveryCharge.toFixed(2)}</span></div>
              ) : null}
              {appliedCoupon ? (
                <div className="flex justify-between text-emerald-700"><span>Coupon ({appliedCoupon.code})</span><span>- ${couponDiscount.toFixed(2)}</span></div>
              ) : null}
              <div className="flex justify-between pt-1 text-base font-bold text-zinc-900">
                <span>Total</span><span className="text-emerald-700">${total.toFixed(2)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={placeOrder}
              disabled={loading || authLoading}
              className="cursor-pointer mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? <><Loader2 className="size-4 animate-spin" /> Placing Order…</>
                : authLoading
                  ? "Checking login..."
                  : authUser
                    ? `Place Order · $${total.toFixed(2)}`
                    : "Login to Continue"}
            </button>
          </div>
        </div>

      </div>
      <Modal
        open={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setOtpStep("phone");
          setOtpError("");
        }}
        title="Login to continue checkout"
      >
        <div className="space-y-4">
          {otpError ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {otpError}
            </p>
          ) : null}
          {otpDevHint ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
              {otpDevHint}
            </p>
          ) : null}
          {otpStep === "phone" ? (
            <>
              <p className="text-sm text-zinc-400">Enter mobile number to receive OTP.</p>
              <input
                value={otpPhone}
                onChange={(e) => setOtpPhone(e.target.value)}
                inputMode="tel"
                autoComplete="tel"
                placeholder="+1 555 000 0000"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-3 text-sm text-zinc-100 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15"
              />
              <button
                type="button"
                disabled={otpLoading}
                onClick={requestOtp}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                {otpLoading ? <Loader2 className="size-4 animate-spin" /> : <Phone className="size-4" />}
                Send OTP
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-zinc-400">Enter the 6-digit code sent to {otpPhone}.</p>
              <div className="flex items-center justify-between gap-2">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpRefs.current[idx] = el;
                    }}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
                        otpRefs.current[idx - 1]?.focus();
                      }
                    }}
                    inputMode="numeric"
                    maxLength={1}
                    className="h-12 w-11 rounded-lg border border-zinc-700 bg-zinc-950/60 text-center text-lg font-semibold text-zinc-100 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15"
                  />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setOtpStep("phone")}
                  className="text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Change number
                </button>
                <button
                  type="button"
                  disabled={otpCooldown > 0 || otpLoading}
                  onClick={resendOtp}
                  className="text-xs font-semibold text-emerald-400 disabled:text-zinc-500"
                >
                  {otpCooldown > 0 ? `Resend in ${Math.floor(otpCooldown / 60)}:${String(otpCooldown % 60).padStart(2, "0")}` : "Resend OTP"}
                </button>
              </div>
              <button
                type="button"
                disabled={otpLoading}
                onClick={verifyOtp}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                {otpLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                Verify & Continue
              </button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
