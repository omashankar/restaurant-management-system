"use client";

import { useApp } from "@/context/AppProviders";
import { useUser } from "@/context/AuthContext";
import {
  EMPTY_PROFILE_ERRORS,
  getProfileFormFieldErrors,
} from "@/lib/formValidation";
import { uploadImageWithCompression } from "@/lib/clientImageUpload";
import { validatePasswordChangeForm } from "@/lib/restaurantSettingsValidation";
import { validateImageFileType } from "@/lib/uploadImageShared";
import { useEffect, useState } from "react";

/**
 * Manages profile form state, validation, save, and password change.
 */
export function useProfile() {
  const { user, updateProfile } = useApp();
  const { setUser } = useUser();
  // AppProvider shares AuthContext user; keep setUser on both after save/upload

  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [formDirty, setFormDirty] = useState(false);
  const [fieldErrors, setFieldErrors] = useState(EMPTY_PROFILE_ERRORS);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
    });
    setFormDirty(false);
    setFieldErrors(EMPTY_PROFILE_ERRORS);
  }, [user?.id, user?.name, user?.email, user?.phone]);

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setFormDirty(true);
    setFieldErrors((e) => ({ ...e, [key]: "" }));
  };

  const resetForm = () => {
    setForm({
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
    });
    setFormDirty(false);
    setFieldErrors(EMPTY_PROFILE_ERRORS);
  };

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwDirty, setPwDirty] = useState(false);
  const [pwErrors, setPwErrors] = useState({ current: "", next: "", confirm: "" });

  const setPwField = (key, value) => {
    setPwForm((f) => ({ ...f, [key]: value }));
    setPwDirty(true);
    setPwErrors((e) => ({ ...e, [key]: "" }));
  };

  const resetPw = () => {
    setPwForm({ current: "", next: "", confirm: "" });
    setPwDirty(false);
    setPwErrors({ current: "", next: "", confirm: "" });
  };

  const uploadAvatar = async (file) => {
    if (!file) return;

    const typeCheck = validateImageFileType(file);
    if (!typeCheck.ok) {
      showToast("error", typeCheck.error);
      return;
    }

    setAvatarUploading(true);
    try {
      const data = await uploadImageWithCompression(file, {
        url: "/api/auth/profile/avatar",
        preset: "avatar",
      });
      if (!data.success) {
        showToast("error", data.error ?? "Failed to upload profile photo.");
        return;
      }
      if (data.user) {
        updateProfile(data.user);
        setUser(data.user);
      }
      showToast("success", "Profile photo updated.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const saveProfile = async () => {
    const validation = getProfileFormFieldErrors(form);
    setFieldErrors(validation.errors);
    if (!validation.valid) return;

    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) {
        if (data.errors) setFieldErrors((e) => ({ ...e, ...data.errors }));
        showToast("error", data.error ?? "Failed to update profile.");
        return;
      }
      updateProfile(data.user);
      setUser(data.user);
      setFormDirty(false);
      showToast("success", "Profile updated successfully.");
    } catch {
      showToast("error", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    const validation = validatePasswordChangeForm(pwForm);
    setPwErrors(validation.errors);
    if (!validation.valid) return false;

    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(pwForm),
      });
      const data = await res.json();
      if (!data.success) {
        if (data.errors) setPwErrors((e) => ({ ...e, ...data.errors }));
        showToast("error", data.error ?? "Failed to change password.");
        return false;
      }
      resetPw();
      showToast("success", data.message ?? "Password changed successfully.");
      return true;
    } catch {
      showToast("error", "Network error. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  return {
    user,
    form,
    setField,
    resetForm,
    formDirty,
    fieldErrors,
    pwForm,
    setPwField,
    resetPw,
    pwDirty,
    pwErrors,
    saving,
    avatarUploading,
    toast,
    saveProfile,
    uploadAvatar,
    savePassword,
  };
}
