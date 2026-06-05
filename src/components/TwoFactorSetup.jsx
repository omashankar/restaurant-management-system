"use client";

import {
  saBtnPrimarySmCls,
  saInputCls,
  saSuccessTextCls,
} from "@/config/superAdminTheme";
import { Loader2, Shield } from "lucide-react";
import { useState } from "react";

export default function TwoFactorSetup() {
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("idle");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const startSetup = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (!data.success) {
        setMessage(data.error ?? "Setup failed.");
        return;
      }
      setQr(data.qrDataUrl ?? "");
      setSecret(data.secret ?? "");
      setStep("scan");
    } catch {
      setMessage("Network error.");
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth/2fa/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!data.success) {
        setMessage(data.error ?? "Invalid code.");
        return;
      }
      setMessage("Two-factor authentication is enabled.");
      setStep("done");
    } catch {
      setMessage("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-surface-card p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="sa-icon-badge flex size-9 items-center justify-center rounded-xl">
          <Shield className="size-4" />
        </span>
        <div>
          <h2 className="admin-surface-title text-sm font-semibold">Two-factor authentication</h2>
          <p className="text-xs admin-surface-muted">
            Required when platform 2FA is enabled. Use Google Authenticator or similar.
          </p>
        </div>
      </div>

      {step === "idle" && (
        <button
          type="button"
          onClick={startSetup}
          disabled={loading}
          className={`cursor-pointer ${saBtnPrimarySmCls} disabled:opacity-50`}
        >
          {loading ? <Loader2 className="inline size-4 animate-spin" /> : "Set up authenticator"}
        </button>
      )}

      {step === "scan" && (
        <div className="space-y-4">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="QR code for authenticator" className="mx-auto size-44 rounded-lg bg-white p-2" />
          ) : null}
          {secret ? (
            <p className="break-all text-center text-xs admin-surface-muted">
              Manual key: <span className="font-mono admin-surface-body">{secret}</span>
            </p>
          ) : null}
          <input
            type="tel"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="6-digit code"
            className={saInputCls}
          />
          <button
            type="button"
            onClick={confirm}
            disabled={loading || code.length !== 6}
            className={`cursor-pointer w-full sa-btn-primary py-2.5 text-sm font-semibold disabled:opacity-50`}
          >
            {loading ? "Verifying…" : "Confirm & enable"}
          </button>
        </div>
      )}

      {step === "done" && (
        <p className={`text-sm ${saSuccessTextCls}`}>2FA is active on your account.</p>
      )}

      {message ? (
        <p
          className={`mt-3 text-xs ${
            message.includes("enabled") || message.includes("active")
              ? saSuccessTextCls
              : "text-red-400"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
