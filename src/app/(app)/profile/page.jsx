"use client";

import PhoneInput from "@/components/ui/PhoneInput";
import { useProfile } from "@/hooks/useProfile";
import { roleLabel } from "@/context/AppProviders";
import { normalizeLogoSrc } from "@/lib/logoUrl";
import Image from "next/image";
import {
  Camera,
  CheckCircle2,
  Loader2,
  Mail,
  Shield,
  User,
  XCircle,
} from "lucide-react";
import { useRef } from "react";

// ── reusable input ────────────────────────────────────────────────────────────
function Field({ label, icon: Icon, type = "text", value, onChange, readOnly, placeholder, error }) {
  const inputMode =
    type === "tel" ? "numeric" : type === "number" ? "numeric" : undefined;
  const borderCls = error ? "border-red-500/50" : readOnly ? "admin-shell-border" : "border-zinc-700";
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
          inputMode={inputMode}
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          readOnly={readOnly}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          className={`w-full rounded-xl border admin-surface-card py-2.5 text-sm admin-shell-text outline-none transition-all ${
            Icon ? "pl-10 pr-4" : "px-4"
          } ${
            readOnly
              ? "cursor-not-allowed text-zinc-500"
              : "focus-ra-primary focus:ring-2 focus:ring-ra-primary-25"
          } ${borderCls}`}
        />
      </div>
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}

// ── section card ──────────────────────────────────────────────────────────────
function Section({ title, description, icon: Icon, children }) {
  return (
    <div className="admin-surface-card p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-ra-primary-15 text-ra-primary ring-1 ring-ra-primary-20">
          <Icon className="size-4" aria-hidden />
        </span>
        <div>
          <h2 className="text-sm font-semibold admin-shell-text">{title}</h2>
          {description && <p className="text-xs admin-surface-muted">{description}</p>}
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
    form, setField, resetForm, formDirty, fieldErrors,
    saving, avatarUploading, toast,
    saveProfile, uploadAvatar,
  } = useProfile();

  const fileRef = useRef(null);
  const avatarSrc = normalizeLogoSrc(user?.avatarUrl);
  const avatarFallback = user?.name?.trim()?.[0]?.toUpperCase() ?? "U";

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadAvatar(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="admin-page-title text-2xl font-semibold tracking-tight">My Profile</h1>
        <p className="admin-page-desc mt-1 text-sm">Manage your personal details and security.</p>
      </div>

      {/* ── Avatar card ── */}
      <div className="flex items-center gap-5 admin-surface-card p-5">
        <div className="relative shrink-0">
          {avatarSrc ? (
            <Image src={avatarSrc} alt="" width={80} height={80} className="size-20 rounded-full object-cover ring-2 ring-ra-primary-40" unoptimized />
          ) : (
            <span className="flex size-20 items-center justify-center rounded-full admin-rank-badge text-2xl font-bold admin-shell-text">
              {avatarFallback}
            </span>
          )}
          <button
            type="button"
            disabled={avatarUploading}
            onClick={() => fileRef.current?.click()}
            className="cursor-pointer absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border-2 border-zinc-900 bg-ra-primary text-zinc-950 transition-colors hover:brightness-110 disabled:opacity-60"
            aria-label="Change profile photo"
          >
            {avatarUploading ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold admin-shell-text">{user?.name}</p>
          <p className="text-sm admin-surface-muted">{user?.email}</p>
          <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-ra-primary-15 px-2.5 py-0.5 text-xs font-semibold text-ra-primary ring-1 ring-ra-primary-25">
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
            error={fieldErrors.name}
          />
          <Field
            label="Email"
            icon={Mail}
            type="email"
            value={form.email}
            onChange={(v) => setField("email", v)}
            placeholder="your.email@company.com"
            error={fieldErrors.email}
          />
          <PhoneInput
            id="profile-phone"
            label="Phone"
            labelClassName="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500"
            value={form.phone}
            onChange={(v) => setField("phone", v)}
            placeholder="9876543210"
            error={fieldErrors.phone}
            wrapperClassName="border-zinc-700 admin-surface-card"
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
              className="cursor-pointer rounded-xl border admin-shell-border px-4 py-2 text-sm font-medium admin-surface-body transition-colors hover:border-zinc-500 hover:admin-shell-text"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={saveProfile}
            disabled={saving || !formDirty}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-ra-primary px-5 py-2 text-sm font-semibold text-zinc-950 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </Section>

      {/* ── Toast ── */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl shadow-black/40 transition-all ${
            toast.type === "success"
              ? "border-ra-primary-30 admin-surface-card text-ra-primary-muted"
              : "border-red-500/30 admin-surface-card text-red-300"
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
