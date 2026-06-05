"use client";

import { raInputCls } from "@/config/restaurantAdminTheme";
import { adminSurface } from "@/config/adminSurfaceClasses";
import { useLanguage } from "@/context/LanguageContext";
import { CheckCircle2, ChevronRight, Loader2, Upload } from "lucide-react";
import { validateOnboardingFinish, validateOnboardingStep } from "@/lib/restaurantSettingsValidation";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { otpInputProps, phoneInputProps, pincodeInputProps } from "@/lib/formInputTypes";

const RESTAURANT_TYPES = [
  "Restaurant", "Cafe", "Cloud Kitchen", "Bakery", "Fast Food",
  "Dhaba", "Bar & Restaurant", "Food Truck", "Sweet Shop", "Juice Bar",
];

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

const EMPTY_DRAFT = {
  // Step 1
  mobile: "", mobileVerified: false,
  // Step 2
  restaurantName: "", restaurantType: "", logoName: "", bannerName: "",
  // Step 3
  address: "", city: "", state: "", pincode: "", deliveryRadius: "5",
  // Step 4
  upiId: "", bankName: "", accountNumber: "", ifscCode: "",
  // Step 5
  categories: [], items: [],
  // Step 6
  openingHours: DAYS.map((d) => ({ day: d, open: "09:00", close: "22:00", closed: false })),
  deliveryCharge: "40", taxRate: "5",
};

const TOTAL_STEPS = 7;

function ProgressBar({ current, total }) {
  const pct = Math.round(((current - 1) / (total - 1)) * 100);
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs admin-surface-muted">Step {current} of {total}</span>
        <span className="text-xs text-ra-primary font-medium">{pct}% complete</span>
      </div>
      <div className="h-2 rounded-full admin-surface-segment-track">
        <div
          className="h-2 rounded-full bg-ra-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-3 flex justify-between">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`flex size-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
            i + 1 < current ? "bg-ra-primary text-zinc-950" :
            i + 1 === current ? "bg-ra-primary-20 text-ra-primary ring-2 ring-ra-primary-25" :
            "admin-surface-segment-btn"
          }`}>
            {i + 1 < current ? <CheckCircle2 className="size-4" /> : i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}

function StepCard({ title, description, children }) {
  return (
    <div className={`${adminSurface.card} p-6 sm:p-8`}>
      <div className="mb-6">
        <h2 className={`text-xl font-semibold ${adminSurface.title}`}>{title}</h2>
        {description && <p className="admin-page-desc mt-1 text-sm">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs admin-surface-faint">{hint}</p>}
    </div>
  );
}

const inputCls = raInputCls;

export default function OnboardingPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [autoSaveMsg, setAutoSaveMsg] = useState("");
  const [saveError, setSaveError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpHint, setOtpHint] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const autoSaveTimer = useRef(null);

  // Auto-save draft to localStorage
  useEffect(() => {
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem("rms-onboarding-draft", JSON.stringify({ step, draft }));
        setAutoSaveMsg(t("onboarding.autoSaved"));
        setTimeout(() => setAutoSaveMsg(""), 2000);
      } catch { /* ignore */ }
    }, 1000);
    return () => clearTimeout(autoSaveTimer.current);
  }, [draft, step, t]);

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("rms-onboarding-draft");
      if (saved) {
        const { step: s, draft: d } = JSON.parse(saved);
        if (s && d) { setStep(s); setDraft(d); }
      }
    } catch { /* ignore */ }
  }, []);

  function update(patch) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  async function sendOtp() {
    if (!draft.mobile || draft.mobile.length < 10) return;
    setOtpLoading(true);
    setOtpError("");
    setOtpHint("");
    try {
      const res = await fetch("/api/auth/onboarding/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: draft.mobile }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setOtpError(data?.error ?? "Failed to send OTP.");
        return;
      }
      setOtpSent(true);
      if (data.devOtp) {
        setOtpHint(`Dev OTP: ${data.devOtp}`);
      } else if (!data.smsSent) {
        setOtpHint("SMS not sent — configure platform SMS in Super Admin settings.");
      }
    } catch {
      setOtpError("Network error. Try again.");
    } finally {
      setOtpLoading(false);
    }
  }

  async function verifyOtp() {
    if (otp.length < 6) return;
    setOtpLoading(true);
    setOtpError("");
    try {
      const res = await fetch("/api/auth/onboarding/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: draft.mobile, otp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setOtpError(data?.error ?? "Invalid OTP.");
        return;
      }
      update({ mobileVerified: true });
      setOtpHint("");
    } catch {
      setOtpError("Network error. Try again.");
    } finally {
      setOtpLoading(false);
    }
  }

  function nextStep() {
    const validation = validateOnboardingStep(step, draft);
    setFieldErrors(validation.errors);
    if (!validation.valid) {
      setSaveError(validation.message ?? "Fix the highlighted fields.");
      if (step === 1 && !draft.mobileVerified) {
        setOtpError(validation.errors.mobileVerified ?? "Please verify your mobile number.");
      }
      return;
    }
    setSaveError("");
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  }

  function prevStep() {
    if (step > 1) setStep((s) => s - 1);
  }

  async function finishOnboarding() {
    if (!draft.mobileVerified) {
      setSaveError("Please verify your mobile number in Step 1 before launching.");
      setStep(1);
      return;
    }

    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          general: {
            restaurantName: draft.restaurantName,
            currency: "INR",
            timezone: "Asia/Kolkata",
            language: "Hindi",
          },
          contact: {
            phoneNumber: draft.mobile,
            address: `${draft.address}, ${draft.city}, ${draft.state} - ${draft.pincode}`,
          },
          pos: {
            taxPercentage: draft.taxRate,
            serviceCharge: draft.deliveryCharge,
            enableDiscount: true,
            enableTips: false,
            roundOffTotal: true,
          },
          openingHours: draft.openingHours,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setSaveError(data?.error ?? "Could not save settings. Please try again.");
        return;
      }

      if (draft.categories?.length > 0) {
        await Promise.allSettled(
          draft.categories.map((name) =>
            fetch("/api/categories", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, description: "" }),
            }),
          ),
        );
      }

      localStorage.removeItem("rms-onboarding-draft");
      router.push("/dashboard");
    } catch {
      setSaveError("Network error. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen admin-shell-bg px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="admin-page-title text-3xl font-bold">{t("onboarding.title")}</h1>
          <p className="mt-2 text-zinc-500">{t("onboarding.subtitle")}</p>
          {autoSaveMsg && (
            <p className="mt-2 text-xs text-ra-primary">✓ {autoSaveMsg}</p>
          )}
        </div>

        <ProgressBar current={step} total={TOTAL_STEPS} />

        {/* Step 1: Account Setup */}
        {step === 1 && (
          <StepCard title={t("onboarding.step1")} description="Verify your mobile number to get started">
            <div className="space-y-4">
              <Field label="Mobile Number">
                <div className="flex gap-2">
                  <span className="flex items-center admin-surface-card px-3 text-sm admin-surface-muted">+91</span>
                  <input
                    {...phoneInputProps()}
                    value={draft.mobile}
                    onChange={(e) => update({ mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                    placeholder="9876543210"
                    className={inputCls}
                    maxLength={10}
                  />
                </div>
              </Field>

              {otpError && (
                <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {otpError}
                </div>
              )}
              {otpHint && (
                <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  {otpHint}
                </div>
              )}

              {!otpSent ? (
                <button type="button" onClick={sendOtp} disabled={otpLoading || draft.mobile.length < 10}
                  className="cursor-pointer w-full rounded-xl bg-ra-primary py-2.5 text-sm font-semibold text-zinc-950 hover:brightness-110 disabled:opacity-50 transition-colors">
                  {otpLoading ? <Loader2 className="mx-auto size-4 animate-spin" /> : "Send OTP"}
                </button>
              ) : !draft.mobileVerified ? (
                <div className="space-y-3">
                  <Field label={`${t("onboarding.enterOtp")} +91 ${draft.mobile}`}>
                    <input
                      {...otpInputProps()}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="Enter 6-digit OTP"
                      className={inputCls}
                      maxLength={6}
                    />
                  </Field>
                  <button type="button" onClick={verifyOtp} disabled={otpLoading || otp.length < 6}
                    className="cursor-pointer w-full rounded-xl bg-ra-primary py-2.5 text-sm font-semibold text-zinc-950 hover:brightness-110 disabled:opacity-50 transition-colors">
                    {otpLoading ? <Loader2 className="mx-auto size-4 animate-spin" /> : "Verify OTP"}
                  </button>
                  <button type="button" onClick={sendOtp} disabled={otpLoading}
                    className="cursor-pointer w-full text-sm admin-surface-muted hover:admin-surface-body transition-colors disabled:opacity-50">
                    {t("onboarding.resendOtp")}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-ra-primary-25 bg-ra-primary-10 px-4 py-3 text-sm text-ra-primary">
                  <CheckCircle2 className="size-4" /> Mobile verified successfully!
                </div>
              )}
            </div>
          </StepCard>
        )}

        {/* Step 2: Restaurant Info */}
        {step === 2 && (
          <StepCard title={t("onboarding.step2")} description="Tell us about your restaurant">
            <div className="space-y-4">
              <Field label="Restaurant Name">
                <input
                  value={draft.restaurantName}
                  onChange={(e) => {
                    update({ restaurantName: e.target.value });
                    if (fieldErrors.restaurantName) setFieldErrors((p) => ({ ...p, restaurantName: "" }));
                  }}
                  placeholder="e.g. Sharma Ji Ka Dhaba"
                  aria-invalid={fieldErrors.restaurantName ? true : undefined}
                  className={`${inputCls} ${fieldErrors.restaurantName ? "border-red-500/50" : ""}`}
                />
                {fieldErrors.restaurantName && (
                  <p className="text-xs text-red-400">{fieldErrors.restaurantName}</p>
                )}
                {fieldErrors.restaurantType && (
                  <p className="text-xs text-red-400">{fieldErrors.restaurantType}</p>
                )}
              </Field>
              <Field label={t("onboarding.restaurantType")}>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {RESTAURANT_TYPES.map((type) => (
                    <button key={type} type="button" onClick={() => update({ restaurantType: type })}
                      className={`cursor-pointer rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                        draft.restaurantType === type
                          ? "border-ra-primary-40 bg-ra-primary-15 text-ra-primary"
                          : "admin-shell-border admin-surface-segment-track text-zinc-400 hover:border-zinc-700 hover:admin-shell-text"
                      }`}>
                      {type}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("onboarding.uploadLogo")}>
                  <label className="flex cursor-pointer items-center gap-2 admin-surface-card px-3 py-2.5 text-sm admin-surface-muted hover:border-zinc-700 transition-colors">
                    <Upload className="size-4" />
                    <span>{draft.logoName || "Choose logo (PNG/JPG)"}</span>
                    <input type="file" className="hidden" accept="image/*"
                      onChange={(e) => update({ logoName: e.target.files?.[0]?.name || "" })} />
                  </label>
                </Field>
                <Field label={t("onboarding.uploadBanner")}>
                  <label className="flex cursor-pointer items-center gap-2 admin-surface-card px-3 py-2.5 text-sm admin-surface-muted hover:border-zinc-700 transition-colors">
                    <Upload className="size-4" />
                    <span>{draft.bannerName || "Choose banner (1200×400)"}</span>
                    <input type="file" className="hidden" accept="image/*"
                      onChange={(e) => update({ bannerName: e.target.files?.[0]?.name || "" })} />
                  </label>
                </Field>
              </div>
            </div>
          </StepCard>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <StepCard title={t("onboarding.step3")} description="Where is your restaurant located?">
            <div className="space-y-4">
              <Field label="Street Address">
                <input value={draft.address} onChange={(e) => update({ address: e.target.value })}
                  placeholder="Shop No. 12, MG Road" className={inputCls} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="City">
                  <input value={draft.city} onChange={(e) => update({ city: e.target.value })}
                    placeholder="Mumbai" className={inputCls} />
                </Field>
                <Field label="State">
                  <input value={draft.state} onChange={(e) => update({ state: e.target.value })}
                    placeholder="Maharashtra" className={inputCls} />
                </Field>
                <Field label="Pincode">
                  <input
                    {...pincodeInputProps()}
                    value={draft.pincode}
                    onChange={(e) => update({ pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                    placeholder="400001"
                    className={inputCls}
                    maxLength={6}
                  />
                </Field>
              </div>
              <Field label={t("onboarding.deliveryRadius")} hint="Customers within this radius can order delivery">
                <div className="flex items-center gap-3">
                  <input type="range" min="1" max="30" value={draft.deliveryRadius}
                    onChange={(e) => update({ deliveryRadius: e.target.value })}
                    className="flex-1 accent-ra-primary" />
                  <span className="w-16 admin-surface-card px-3 py-2 text-center text-sm font-semibold text-ra-primary">
                    {draft.deliveryRadius} km
                  </span>
                </div>
              </Field>
              {/* Google Maps placeholder */}
              <div className="rounded-xl admin-surface-card p-4 text-center text-sm admin-surface-muted">
                📍 Google Maps integration — pin your exact location
                <p className="mt-1 text-xs admin-surface-faint">Add NEXT_PUBLIC_GOOGLE_MAPS_KEY to .env to enable map picker</p>
              </div>
            </div>
          </StepCard>
        )}

        {/* Step 4: Payments */}
        {step === 4 && (
          <StepCard title={t("onboarding.step4")} description="Setup payment collection for your restaurant">
            <div className="space-y-4">
              <Field label="UPI ID" hint="Customers can pay directly to your UPI">
                <input value={draft.upiId} onChange={(e) => update({ upiId: e.target.value })}
                  placeholder="yourname@upi or 9876543210@paytm" className={inputCls} />
              </Field>
              <div className="rounded-xl admin-surface-card p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Bank Account (for settlements)</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Bank Name">
                    <input value={draft.bankName} onChange={(e) => update({ bankName: e.target.value })}
                      placeholder="HDFC Bank" className={inputCls} />
                  </Field>
                  <Field label="Account Number">
                    <input value={draft.accountNumber} onChange={(e) => update({ accountNumber: e.target.value })}
                      placeholder="1234567890" className={inputCls} />
                  </Field>
                  <Field label="IFSC Code">
                    <input value={draft.ifscCode} onChange={(e) => update({ ifscCode: e.target.value.toUpperCase() })}
                      placeholder="HDFC0001234" className={inputCls} />
                  </Field>
                </div>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-400">
                💡 You can configure Razorpay, Stripe, and other gateways later in Settings → Gateway Settings
              </div>
            </div>
          </StepCard>
        )}

        {/* Step 5: Menu Setup */}
        {step === 5 && (
          <StepCard title={t("onboarding.step5")} description="Add your first categories and menu items">
            <div className="space-y-4">
              <div className="rounded-xl admin-surface-card p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Quick Categories</p>
                <div className="flex flex-wrap gap-2">
                  {["Starters", "Main Course", "Breads", "Rice & Biryani", "Desserts", "Beverages", "Thali", "Snacks"].map((cat) => {
                    const active = draft.categories.includes(cat);
                    return (
                      <button key={cat} type="button"
                        onClick={() => update({ categories: active ? draft.categories.filter((c) => c !== cat) : [...draft.categories, cat] })}
                        className={`cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                          active ? "border-ra-primary-40 bg-ra-primary-15 text-ra-primary" : "admin-shell-border admin-surface-segment-track text-zinc-500 hover:border-zinc-700 hover:admin-surface-body"
                        }`}>
                        {active ? "✓ " : ""}{cat}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-xl border admin-shell-border admin-surface-card p-4 text-center text-sm admin-surface-muted">
                <p>You can add detailed menu items after setup</p>
                <p className="mt-1 text-xs admin-surface-faint">Go to Menu → Menu Items to add dishes with photos, prices, and descriptions</p>
              </div>
            </div>
          </StepCard>
        )}

        {/* Step 6: Hours & Taxes */}
        {step === 6 && (
          <StepCard title={t("onboarding.step6")} description="Set your operating hours and charges">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t("onboarding.deliveryCharges")} hint="Flat delivery charge per order">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm admin-surface-muted">₹</span>
                    <input type="number" inputMode="decimal" min={0} value={draft.deliveryCharge} onChange={(e) => update({ deliveryCharge: e.target.value })}
                      className={`${inputCls} pl-7`} placeholder="40" />
                  </div>
                </Field>
                <Field label={t("onboarding.taxRate")} hint="GST applied on orders">
                  <div className="relative">
                    <input type="number" inputMode="decimal" min={0} max={100} value={draft.taxRate} onChange={(e) => update({ taxRate: e.target.value })}
                      className={`${inputCls} pr-7`} placeholder="5" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm admin-surface-muted">%</span>
                  </div>
                </Field>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">{t("onboarding.openingHours")}</p>
                <div className="space-y-2">
                  {draft.openingHours.map((row, i) => (
                    <div key={row.day} className="flex items-center gap-3 rounded-xl admin-surface-card px-3 py-2">
                      <span className="w-24 text-xs font-medium admin-surface-body">{row.day.slice(0, 3)}</span>
                      <input type="time" value={row.open} disabled={row.closed}
                        onChange={(e) => update({ openingHours: draft.openingHours.map((d, j) => j === i ? { ...d, open: e.target.value } : d) })}
                        className="admin-surface-input rounded-lg px-2 py-1 text-xs outline-none disabled:opacity-40" />
                      <span className="text-xs admin-surface-faint">to</span>
                      <input type="time" value={row.close} disabled={row.closed}
                        onChange={(e) => update({ openingHours: draft.openingHours.map((d, j) => j === i ? { ...d, close: e.target.value } : d) })}
                        className="admin-surface-input rounded-lg px-2 py-1 text-xs outline-none disabled:opacity-40" />
                      <label className="ml-auto flex items-center gap-1.5 text-xs admin-surface-muted cursor-pointer">
                        <input type="checkbox" checked={row.closed}
                          onChange={(e) => update({ openingHours: draft.openingHours.map((d, j) => j === i ? { ...d, closed: e.target.checked } : d) })}
                          className="accent-red-500" />
                        Closed
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </StepCard>
        )}

        {/* Step 7: Launch */}
        {step === 7 && (
          <StepCard title={t("onboarding.congratulations")} description={t("onboarding.restaurantReady")}>
            <div className="space-y-4 text-center">
              <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-ra-primary-15 text-5xl">
                🚀
              </div>
              <div className="space-y-2">
                {[
                  { label: "Restaurant Name", value: draft.restaurantName || "—" },
                  { label: "Type", value: draft.restaurantType || "—" },
                  { label: "Location", value: draft.city ? `${draft.city}, ${draft.state}` : "—" },
                  { label: "Categories", value: draft.categories.length > 0 ? draft.categories.join(", ") : "—" },
                  { label: "Tax Rate", value: `${draft.taxRate}%` },
                  { label: "Delivery Charge", value: `₹${draft.deliveryCharge}` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between rounded-xl admin-surface-card px-4 py-2.5 text-sm">
                    <span className="text-zinc-500">{label}</span>
                    <span className="font-medium admin-shell-text">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </StepCard>
        )}

        {/* Navigation */}
        {saveError && (
          <div className="mt-6 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {saveError}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button type="button" onClick={prevStep} disabled={step === 1}
            className="cursor-pointer rounded-xl border admin-shell-border px-5 py-2.5 text-sm font-medium text-zinc-400 hover:border-zinc-500 hover:admin-shell-text disabled:opacity-30 transition-colors">
            ← {t("back")}
          </button>

          <button type="button" onClick={() => setStep(s => Math.min(s + 1, TOTAL_STEPS))}
            className="cursor-pointer text-xs admin-surface-faint hover:text-zinc-400 transition-colors">
            {t("onboarding.skipStep")}
          </button>

          {step < TOTAL_STEPS ? (
            <button type="button" onClick={nextStep}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-ra-primary px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:brightness-110 transition-colors">
              {t("next")} <ChevronRight className="size-4" />
            </button>
          ) : (
            <button type="button" onClick={finishOnboarding} disabled={saving}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-ra-primary px-6 py-2.5 text-sm font-semibold text-zinc-950 hover:brightness-110 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {saving ? "Launching..." : t("onboarding.launchRestaurant")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
