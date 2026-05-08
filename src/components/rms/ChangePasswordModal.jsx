"use client";

import Modal from "@/components/ui/Modal";
import { useProfile } from "@/hooks/useProfile";
import { CheckCircle2, KeyRound, Loader2, XCircle } from "lucide-react";

function PasswordField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </label>
      <div className="relative">
        <KeyRound
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
          aria-hidden
        />
        <input
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-950/60 py-2.5 pl-10 pr-4 text-sm text-zinc-100 outline-none transition-all focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15"
        />
      </div>
    </div>
  );
}

export default function ChangePasswordModal({ open, onClose }) {
  const { pwForm, setPwField, resetPw, pwDirty, saving, toast, savePassword } = useProfile();

  const handleClose = () => {
    resetPw();
    onClose();
  };

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
            className="cursor-pointer rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={savePassword}
            disabled={saving || !pwDirty}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-zinc-950 transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {saving ? "Updating..." : "Update Password"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <PasswordField
          label="Current Password"
          value={pwForm.current}
          onChange={(v) => setPwField("current", v)}
          placeholder="••••••••"
        />
        <PasswordField
          label="New Password"
          value={pwForm.next}
          onChange={(v) => setPwField("next", v)}
          placeholder="Min. 6 characters"
        />
        <PasswordField
          label="Confirm New Password"
          value={pwForm.confirm}
          onChange={(v) => setPwField("confirm", v)}
          placeholder="Repeat new password"
        />

        {toast ? (
          <div
            className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm font-medium ${
              toast.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
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
