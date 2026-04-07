"use client";

import { useProfile } from "@/hooks/useProfile";
import { roleLabel } from "@/context/AppProviders";
import {
  Camera,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  Phone,
  Shield,
  User,
  XCircle,
} from "lucide-react";
import { useRef, useState } from "react";

// ── reusable input ────────────────────────────────────────────────────────────
function Field({ label, icon: Icon, type = "text", value, onChange, readOnly, placeholder }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" aria-hidden />
        )}
        <input
          type={type}
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          readOnly={readOnly}
          placeholder={placeholder}
          className={`w-full rounded-xl border bg-zinc-950/60 py-2.5 text-sm text-zinc-100 outline-none transition-all ${
            Icon ? "pl-10 pr-4" : "px-4"
          } ${
            readOnly
              ? "cursor-not-allowed border-zinc-800 text-zinc-500"
              : "border-zinc-700 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15"
          }`}
        />
      </div>
    </div>
  );
}

// ── section card ──────────────────────────────────────────────────────────────
function Section({ title, description, icon: Icon, children }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20">
          <Icon className="size-4" aria-hidden />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
          {description && <p className="text-xs text-zinc-500">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const {
    user,
    form, setField, resetForm, formDirty,
    pwForm, setPwField, resetPw, pwDirty,
    saving, toast,
    saveProfile, savePassword,
  } = useProfile();

  const [avatar, setAvatar] = useState(null);
  const fileRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatar(url);
  };

  const avatarFallback = user?.name?.trim()?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="mx-auto max-w-2xl space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">My Profile</h1>
        <p className="mt-1 text-sm text-zinc-500">Manage your personal details and security.</p>
      </div>

      {/* ── Avatar card ── */}
      <div className="flex items-center gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
        <div className="relative shrink-0">
          {avatar ? (
            <img src={avatar} alt="Avatar" className="size-20 rounded-full object-cover ring-2 ring-emerald-500/40" />
          ) : (
            <span className="flex size-20 items-center justify-center rounded-full bg-zinc-800 text-2xl font-bold text-zinc-200 ring-2 ring-zinc-700">
              {avatarFallback}
            </span>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="cursor-pointer absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border-2 border-zinc-900 bg-emerald-500 text-zinc-950 transition-colors hover:bg-emerald-400"
            aria-label="Change avatar"
          >
            <Camera className="size-3.5" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-zinc-100">{user?.name}</p>
          <p className="text-sm text-zinc-500">{user?.email}</p>
          <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/25">
            <Shield className="size-3" aria-hidden />
            {roleLabel(user?.role)}
          </span>
        </div>
      </div>

      {/* ── Profile form ── */}
      <Section title="Personal Information" description="Update your name, email, and phone." icon={User}>
        <div className="space-y-4">
          <Field
            label="Full Name"
            icon={User}
            value={form.name}
            onChange={(v) => setField("name", v)}
            placeholder="Your full name"
          />
          <Field
            label="Email"
            icon={Mail}
            type="email"
            value={form.email}
            onChange={(v) => setField("email", v)}
            placeholder="you@example.com"
          />
          <Field
            label="Phone"
            icon={Phone}
            value={form.phone}
            onChange={(v) => setField("phone", v)}
            placeholder="+1 555 000 0000"
          />
          <Field
            label="Role"
            icon={Shield}
            value={roleLabel(user?.role)}
            readOnly
          />
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          {formDirty && (
            <button
              type="button"
              onClick={resetForm}
              className="cursor-pointer rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={saveProfile}
            disabled={saving || !formDirty}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-zinc-950 transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </Section>

      {/* ── Change password ── */}
      <Section title="Change Password" description="Use a strong password you don't use elsewhere." icon={KeyRound}>
        <div className="space-y-4">
          <Field
            label="Current Password"
            type="password"
            value={pwForm.current}
            onChange={(v) => setPwField("current", v)}
            placeholder="••••••••"
          />
          <Field
            label="New Password"
            type="password"
            value={pwForm.next}
            onChange={(v) => setPwField("next", v)}
            placeholder="Min. 6 characters"
          />
          <Field
            label="Confirm New Password"
            type="password"
            value={pwForm.confirm}
            onChange={(v) => setPwField("confirm", v)}
            placeholder="Repeat new password"
          />
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          {pwDirty && (
            <button
              type="button"
              onClick={resetPw}
              className="cursor-pointer rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={savePassword}
            disabled={saving || !pwDirty}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-zinc-700 px-5 py-2 text-sm font-semibold text-zinc-100 transition-all hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {saving ? "Updating…" : "Update Password"}
          </button>
        </div>
      </Section>

      {/* ── Toast ── */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl shadow-black/40 transition-all ${
            toast.type === "success"
              ? "border-emerald-500/30 bg-zinc-900 text-emerald-300"
              : "border-red-500/30 bg-zinc-900 text-red-300"
          }`}
        >
          {toast.type === "success"
            ? <CheckCircle2 className="size-4 shrink-0" />
            : <XCircle className="size-4 shrink-0" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
