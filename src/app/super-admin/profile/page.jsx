"use client";

import PhoneInput from "@/components/ui/PhoneInput";
import { saIconBadgeCls, saSpinnerCls } from "@/config/superAdminTheme";
import { roleLabel } from "@/context/AppProviders";
import { useProfile } from "@/hooks/useProfile";
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
import TwoFactorSetup from "@/components/TwoFactorSetup";
import { saInputCls } from "@/config/superAdminTheme";
import { useRef, useState } from "react";

function Field({ label, icon: Icon, type = "text", value, onChange, readOnly, placeholder, error }) {
  const inputMode =
    type === "tel" ? "numeric" : type === "number" ? "numeric" : undefined;
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </label>
      <div className="relative">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" aria-hidden />
        ) : null}
        <input
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          readOnly={readOnly}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          className={`${saInputCls} ${Icon ? "!pl-10" : ""} ${
            readOnly ? "cursor-not-allowed opacity-70" : ""
          } ${error ? "border-red-500/50" : ""}`}
        />
      </div>
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}

function Section({ title, description, icon: Icon, children }) {
  return (
    <div className="admin-surface-card p-4 sm:p-6">
      <div className="mb-5 flex min-w-0 items-start gap-3 sm:items-center">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sa-primary-15 text-sa-primary ring-1 ring-sa-primary-20">
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="break-words text-sm font-semibold admin-shell-text">{title}</h2>
          {description ? <p className="break-words text-xs admin-surface-muted">{description}</p> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

export default function SuperAdminProfilePage() {
  const {
    user,
    form, setField, resetForm, formDirty, fieldErrors,
    saving, avatarUploading, toast,
    saveProfile, uploadAvatar,
  } = useProfile();

  const fileRef = useRef(null);
  const avatarSrc = normalizeLogoSrc(user?.avatarUrl);
  const avatarFallback = user?.name?.trim()?.[0]?.toUpperCase() ?? "S";

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadAvatar(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="min-w-0 w-full max-w-full overflow-x-hidden">
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex min-w-0 items-start gap-3">
        <span className={`mt-1 shrink-0 ${saIconBadgeCls}`}>
          <User className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 className="admin-page-title break-words text-2xl font-semibold tracking-tight">My Profile</h1>
          <p className="admin-page-desc mt-1 break-words text-sm">Manage your super admin profile and security.</p>
        </div>
      </div>

      <div className="flex flex-col items-start gap-4 admin-surface-card p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
        <div className="relative shrink-0">
          {avatarSrc ? (
            <Image src={avatarSrc} alt="" width={80} height={80} className="size-20 rounded-full object-cover ring-2 ring-sa-primary-40" unoptimized />
          ) : (
            <span className="flex size-20 items-center justify-center rounded-full admin-rank-badge text-2xl font-bold admin-shell-text">
              {avatarFallback}
            </span>
          )}
          <button
            type="button"
            disabled={avatarUploading}
            onClick={() => fileRef.current?.click()}
            className="cursor-pointer absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border-2 border-[var(--admin-surface)] bg-sa-primary text-zinc-950 transition-colors hover:brightness-110 disabled:opacity-60"
            aria-label="Change profile photo"
          >
            {avatarUploading ? <Loader2 className="size-3.5 animate-spin text-sa-primary" /> : <Camera className="size-3.5" />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="break-words text-lg font-semibold admin-shell-text">{user?.name}</p>
          <p className="break-all text-sm admin-surface-muted">{user?.email}</p>
          <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-sa-primary-15 px-2.5 py-0.5 text-xs font-semibold text-sa-primary-muted ring-1 ring-sa-primary-25">
            <Shield className="size-3" aria-hidden />
            {roleLabel(user?.role)}
          </span>
        </div>
      </div>

      <Section title="Personal Information" description="Update your name, email, and phone." icon={User}>
        <div className="space-y-4">
          <Field label="Full Name" icon={User} value={form.name} onChange={(v) => setField("name", v)} placeholder="Your full name" error={fieldErrors.name} />
          <Field label="Email" icon={Mail} type="email" value={form.email} onChange={(v) => setField("email", v)} placeholder="your.email@company.com" error={fieldErrors.email} />
          <PhoneInput
            id="super-admin-profile-phone"
            label="Phone"
            labelClassName="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500"
            value={form.phone}
            onChange={(v) => setField("phone", v)}
            placeholder="9876543210"
            error={fieldErrors.phone}
            wrapperClassName="admin-shell-border"
          />
          <Field label="Role" icon={Shield} value={roleLabel(user?.role)} readOnly />
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-2">
          {formDirty ? (
            <button
              type="button"
              onClick={resetForm}
              className="cursor-pointer w-full rounded-xl border admin-shell-border px-4 py-2 text-sm font-medium admin-surface-body transition-colors hover:border-zinc-500 hover:admin-shell-text sm:w-auto"
            >
              Cancel
            </button>
          ) : null}
          <button
            type="button"
            onClick={saveProfile}
            disabled={saving || !formDirty}
            className="cursor-pointer inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sa-primary px-5 py-2 text-sm font-semibold text-zinc-950 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            {saving ? <Loader2 className={saSpinnerCls} /> : null}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </Section>

      <TwoFactorSetup />

      {toast ? (
        <div
          className={`fixed bottom-4 left-4 right-4 z-[320] flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium admin-surface-card-solid transition-all sm:bottom-5 sm:left-auto sm:right-5 sm:max-w-sm ${
            toast.type === "success"
              ? "border-sa-accent-30 admin-surface-card text-sa-accent-muted"
              : "border-red-500/30 admin-surface-card text-red-400"
          }`}
        >
          {toast.type === "success"
            ? <CheckCircle2 className="size-4 shrink-0" />
            : <XCircle className="size-4 shrink-0" />}
          {toast.msg}
        </div>
      ) : null}
    </div>
    </div>
  );
}
