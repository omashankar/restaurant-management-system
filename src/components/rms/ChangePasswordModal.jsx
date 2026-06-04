"use client";

import { adminSurface } from "@/config/adminSurfaceClasses";
import Modal from "@/components/ui/Modal";
import PasswordInput from "@/components/ui/PasswordInput";
import { useProfile } from "@/hooks/useProfile";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

const ACCENT = {
  emerald: {
    btn: "ra-btn-primary",
    hint: "admin-surface-muted",
    focus: "focus-ra-primary",
  },
  ra: {
    btn: "ra-btn-primary",
    hint: "admin-surface-muted",
    focus: "focus-ra-primary",
  },
  rose: {
    btn: "sa-btn-primary",
    hint: "admin-surface-muted",
    focus: "focus-sa-primary",
  },
  sa: {
    btn: "sa-btn-primary",
    hint: "admin-surface-muted",
    focus: "focus-sa-primary",
  },
};

/**
 * @param {{ open: boolean; onClose: () => void; variant?: "emerald" | "rose" | "sa" }} props
 */
export default function ChangePasswordModal({ open, onClose, variant = "emerald" }) {
  const { pwForm, setPwField, resetPw, pwDirty, pwErrors, saving, toast, savePassword } = useProfile();
  const accent = ACCENT[variant] ?? ACCENT.emerald;

  const handleClose = () => {
    resetPw();
    onClose();
  };

  const handleSave = async () => {
    const ok = await savePassword();
    if (ok) {
      setTimeout(() => {
        resetPw();
        onClose();
      }, 1200);
    }
  };

  const inputFocusCls = accent.focus;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Change Password"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="cursor-pointer rounded-xl border admin-shell-border px-4 py-2 text-sm font-medium admin-surface-body transition-colors hover:border-zinc-500 hover:admin-shell-text"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !pwDirty}
            className={`cursor-pointer inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
              variant === "emerald" || variant === "ra" ? "" : "text-zinc-950"
            } ${accent.btn}`}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {saving ? "Updating…" : "Update Password"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className={`text-xs ${accent.hint}`}>
          At least 8 characters, with a number and a special character.
        </p>
        <PasswordInput
          id="pw-current"
          label="Current Password"
          value={pwForm.current}
          onChange={(v) => setPwField("current", v)}
          placeholder="••••••••"
          autoComplete="current-password"
          error={pwErrors.current}
          inputClassName={`${adminSurface.input} py-2.5 pl-10 pr-11 ${
            pwErrors.current ? "border-red-500/50" : "border-zinc-700"
          } ${inputFocusCls}`}
        />
        <PasswordInput
          id="pw-new"
          label="New Password"
          value={pwForm.next}
          onChange={(v) => setPwField("next", v)}
          placeholder="Min. 8 characters"
          autoComplete="new-password"
          error={pwErrors.next}
          inputClassName={`${adminSurface.input} py-2.5 pl-10 pr-11 ${
            pwErrors.next ? "border-red-500/50" : "border-zinc-700"
          } ${inputFocusCls}`}
        />
        <PasswordInput
          id="pw-confirm"
          label="Confirm New Password"
          value={pwForm.confirm}
          onChange={(v) => setPwField("confirm", v)}
          placeholder="Repeat new password"
          autoComplete="new-password"
          error={pwErrors.confirm}
          inputClassName={`${adminSurface.input} py-2.5 pl-10 pr-11 ${
            pwErrors.confirm ? "border-red-500/50" : "border-zinc-700"
          } ${inputFocusCls}`}
        />

        {toast ? (
          <div
            className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm font-medium ${
              toast.type === "success"
                ? "border-ra-primary-30 bg-ra-primary-10 text-ra-primary-muted"
                : "border-red-500/30 bg-red-500/10 text-red-300"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="size-4 shrink-0" />
            ) : (
              <XCircle className="size-4 shrink-0" />
            )}
            {toast.msg}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
