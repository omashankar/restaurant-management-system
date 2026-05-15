"use client";

import { useLanguage } from "@/context/LanguageContext";
import { CheckCircle2, ChevronRight, Loader2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
        <span className="text-xs text-zinc-500">Step {current} of {total}</span>
        <span className="text-xs text-emerald-400 font-medium">{pct}% complete</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-800">
        <div
          className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-3 flex justify-between">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`flex size-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
            i + 1 < current ? "bg-emerald-500 text-zinc-950" :
            i + 1 === current ? "bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500" :
            "bg-zinc-800 text-zinc-600"
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
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-zinc-50">{title}</h2>
        {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
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
      {hint && <p className="mt-1 text-xs text-zinc-600">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors focus:border-emerald-500/45 placeholder:text-zinc-600";

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
    // Simulate OTP send (real implementation would call SMS API)
    await new Promise((r) => setTimeout(r, 1000));
    setOtpSent(true);
    setOtpLoading(false);
  }

  async function verifyOtp() {
    setOtpLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    // In production: verify OTP via API
    update({ mobileVerified: true });
    setOtpLoading(false);
  }

  function nextStep() {
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  }

  function prevStep() {
    if (step > 1) setStep((s) => s - 1);
  }

  async function finishOnboarding() {
    setSaving(true);
    try {
      // Save restaurant settings from onboarding draft
      await fetch("/api/settings", {
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
      // Clear draft
      localStorage.removeItem("rms-onboarding-draft");
      router.push("/dashboard");
    } catch {
      // Still redirect
      router.push("/dashboard");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-zinc-50">{t("onboarding.title")}</h1>
          <p className="mt-2 text-zinc-500">{t("onboarding.subtitle")}</p>
          {autoSaveMsg && (
            <p className="mt-2 text-xs text-emerald-400">✓ {autoSaveMsg}</p>
          )}
        </div>

        <ProgressBar current={step} total={TOTAL_STEPS} />

        {/* Step 1: Account Setup */}
        {step === 1 && (
          <StepCard title={t("onboarding.step1")} description="Verify your mobile number to get started">
            <div className="space-y-4">
              <Field label="Mobile Number">
                <div className="flex gap-2">
                  <span className="flex items-center rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 text-sm text-zinc-400">+91</span>
                  <input value={draft.mobile} onChange={(e) => update({ mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                    placeholder="9876543210" className={inputCls} maxLength={10} />
                </div>
              </Field>

              {!otpSent ? (
                <button type="button" onClick={sendOtp} disabled={otpLoading || draft.mobile.length < 10}
                  className="cursor-pointer w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors">
                  {otpLoading ? <Loader2 className="mx-auto size-4 animate-spin" /> : "Send OTP"}
                </button>
              ) : !draft.mobileVerified ? (
                <div className="space-y-3">
                  <Field label={`${t("onboarding.enterOtp")} +91 ${draft.mobile}`}>
                    <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="Enter 6-digit OTP" className={inputCls} maxLength={6} />
                  </Field>
                  <button type="button" onClick={verifyOtp} disabled={otpLoading || otp.length < 4}
                    className="cursor-pointer w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors">
                    {otpLoading ? <Loader2 className="mx-auto size-4 animate-spin" /> : "Verify OTP"}
                  </button>
                  <button type="button" onClick={sendOtp} className="cursor-pointer w-full text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                    {t("onboarding.resendOtp")}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
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
                <input value={draft.restaurantName} onChange={(e) => update({ restaurantName: e.target.value })}
                  placeholder="e.g. Sharma Ji Ka Dhaba" className={inputCls} />
              </Field>
              <Field label={t("onboarding.restaurantType")}>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {RESTAURANT_TYPES.map((type) => (
                    <button key={type} type="button" onClick={() => update({ restaurantType: type })}
                      className={`cursor-pointer rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                        draft.restaurantType === type
                          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                          : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      }`}>
                      {type}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("onboarding.uploadLogo")}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-400 hover:border-zinc-700 transition-colors">
                    <Upload className="size-4" />
                    <span>{draft.logoName || "Choose logo (PNG/JPG)"}</span>
                    <input type="file" className="hidden" accept="image/*"
                      onChange={(e) => update({ logoName: e.target.files?.[0]?.name || "" })} />
                  </label>
                </Field>
                <Field label={t("onboarding.uploadBanner")}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-400 hover:border-zinc-700 transition-colors">
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
                  <input value={draft.pincode} onChange={(e) => update({ pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                    placeholder="400001" className={inputCls} maxLength={6} />
                </Field>
              </div>
              <Field label={t("onboarding.deliveryRadius")} hint="Customers within this radius can order delivery">
                <div className="flex items-center gap-3">
                  <input type="range" min="1" max="30" value={draft.deliveryRadius}
                    onChange={(e) => update({ deliveryRadius: e.target.value })}
                    className="flex-1 accent-emerald-500" />
                  <span className="w-16 rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-center text-sm font-semibold text-emerald-400">
                    {draft.deliveryRadius} km
                  </span>
                </div>
              </Field>
              {/* Google Maps placeholder */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 text-center text-sm text-zinc-500">
                📍 Google Maps integration — pin your exact location
                <p className="mt-1 text-xs text-zinc-600">Add NEXT_PUBLIC_GOOGLE_MAPS_KEY to .env to enable map picker</p>
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
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
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
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Quick Categories</p>
                <div className="flex flex-wrap gap-2">
                  {["Starters", "Main Course", "Breads", "Rice & Biryani", "Desserts", "Beverages", "Thali", "Snacks"].map((cat) => {
                    const active = draft.categories.includes(cat);
                    return (
                      <button key={cat} type="button"
                        onClick={() => update({ categories: active ? draft.categories.filter((c) => c !== cat) : [...draft.categories, cat] })}
                        className={`cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                          active ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400" : "border-zinc-800 bg-zinc-950/40 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                        }`}>
                        {active ? "✓ " : ""}{cat}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-xl border border-zinc-700 bg-zinc-950/60 p-4 text-center text-sm text-zinc-500">
                <p>You can add detailed menu items after setup</p>
                <p className="mt-1 text-xs text-zinc-600">Go to Menu → Menu Items to add dishes with photos, prices, and descriptions</p>
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
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">₹</span>
                    <input type="number" value={draft.deliveryCharge} onChange={(e) => update({ deliveryCharge: e.target.value })}
                      className={`${inputCls} pl-7`} placeholder="40" />
                  </div>
                </Field>
                <Field label={t("onboarding.taxRate")} hint="GST applied on orders">
                  <div className="relative">
                    <input type="number" value={draft.taxRate} onChange={(e) => update({ taxRate: e.target.value })}
                      className={`${inputCls} pr-7`} placeholder="5" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">%</span>
                  </div>
                </Field>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">{t("onboarding.openingHours")}</p>
                <div className="space-y-2">
                  {draft.openingHours.map((row, i) => (
                    <div key={row.day} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2">
                      <span className="w-24 text-xs font-medium text-zinc-300">{row.day.slice(0, 3)}</span>
                      <input type="time" value={row.open} disabled={row.closed}
                        onChange={(e) => update({ openingHours: draft.openingHours.map((d, j) => j === i ? { ...d, open: e.target.value } : d) })}
                        className="rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 outline-none disabled:opacity-40" />
                      <span className="text-xs text-zinc-600">to</span>
                      <input type="time" value={row.close} disabled={row.closed}
                        onChange={(e) => update({ openingHours: draft.openingHours.map((d, j) => j === i ? { ...d, close: e.target.value } : d) })}
                        className="rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 outline-none disabled:opacity-40" />
                      <label className="ml-auto flex items-center gap-1.5 text-xs text-zinc-500 cursor-pointer">
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
              <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-500/15 text-5xl">
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
                  <div key={label} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-2.5 text-sm">
                    <span className="text-zinc-500">{label}</span>
                    <span className="font-medium text-zinc-200">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </StepCard>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <button type="button" onClick={prevStep} disabled={step === 1}
            className="cursor-pointer rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-30 transition-colors">
            ← {t("back")}
          </button>

          <button type="button" onClick={() => setStep(s => Math.min(s + 1, TOTAL_STEPS))}
            className="cursor-pointer text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            {t("onboarding.skipStep")}
          </button>

          {step < TOTAL_STEPS ? (
            <button type="button" onClick={nextStep}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors">
              {t("next")} <ChevronRight className="size-4" />
            </button>
          ) : (
            <button type="button" onClick={finishOnboarding} disabled={saving}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {saving ? "Launching..." : t("onboarding.launchRestaurant")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
