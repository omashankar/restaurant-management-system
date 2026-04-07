"use client";

import { useApp } from "@/context/AppProviders";
import { useState } from "react";

/**
 * Manages profile form state, validation, save, and password change.
 */
export function useProfile() {
  const { user, updateProfile } = useApp();

  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState(null); // { type: "success"|"error", msg }

  // ── profile form ──────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name:  user?.name  ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  });
  const [formDirty, setFormDirty] = useState(false);

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setFormDirty(true);
  };

  const resetForm = () => {
    setForm({ name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "" });
    setFormDirty(false);
  };

  // ── password form ─────────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwDirty, setPwDirty] = useState(false);

  const setPwField = (key, value) => {
    setPwForm((f) => ({ ...f, [key]: value }));
    setPwDirty(true);
  };

  const resetPw = () => {
    setPwForm({ current: "", next: "", confirm: "" });
    setPwDirty(false);
  };

  // ── validation ────────────────────────────────────────────────────────────
  function validateProfile() {
    if (!form.name.trim())  return "Name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Enter a valid email.";
    if (form.phone && !/^[\d\s+\-()]{7,15}$/.test(form.phone)) return "Enter a valid phone number.";
    return null;
  }

  function validatePassword() {
    if (!pwForm.current.trim()) return "Current password is required.";
    if (pwForm.next.length < 6) return "New password must be at least 6 characters.";
    if (pwForm.next !== pwForm.confirm) return "Passwords do not match.";
    return null;
  }

  // ── save profile ──────────────────────────────────────────────────────────
  const saveProfile = async () => {
    const err = validateProfile();
    if (err) { showToast("error", err); return; }

    setSaving(true);
    await new Promise((r) => setTimeout(r, 700)); // simulate async
    updateProfile({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() });
    setFormDirty(false);
    setSaving(false);
    showToast("success", "Profile updated successfully.");
  };

  // ── save password ─────────────────────────────────────────────────────────
  const savePassword = async () => {
    const err = validatePassword();
    if (err) { showToast("error", err); return; }

    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    // In a real app: call API to update password
    resetPw();
    setSaving(false);
    showToast("success", "Password changed successfully.");
  };

  // ── toast ─────────────────────────────────────────────────────────────────
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  return {
    user,
    form, setField, resetForm, formDirty,
    pwForm, setPwField, resetPw, pwDirty,
    saving, toast,
    saveProfile, savePassword,
  };
}
