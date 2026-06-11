"use client";

import { raIconBadgeCls, raInputCls } from "@/config/restaurantAdminTheme";
import { adminSurface } from "@/config/adminSurfaceClasses";
import { useLanguage } from "@/context/LanguageContext";
import { CheckCircle2, Loader2, Plus, Printer, Save, Trash2, Wifi, Bluetooth, Usb, XCircle } from "lucide-react";
import { EMPTY_PRINTER_ERRORS, getPrinterFieldErrors } from "@/lib/formValidation";
import { useCallback, useEffect, useState } from "react";

const PRINTER_TYPES = [
  { id: "network", label: "Network (LAN/WiFi)", Icon: Wifi,      color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20" },
  { id: "bluetooth", label: "Bluetooth",        Icon: Bluetooth, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  { id: "usb",     label: "USB",                Icon: Usb,       color: "text-ra-primary",bg: "bg-ra-primary-10 border-ra-primary-20" },
];

const PAPER_SIZES = ["58mm", "80mm"];

const EMPTY_PRINTER = {
  name: "", type: "network", ipAddress: "", port: "9100",
  paperSize: "80mm", autoPrint: false, printKot: true, printInvoice: true,
};

const inputCls = raInputCls;

function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl admin-surface-card px-3 py-3 sm:gap-4 sm:px-4">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium admin-shell-text">{label}</span>
        {hint && <span className="mt-0.5 block text-xs leading-snug admin-surface-muted">{hint}</span>}
      </span>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-ra-primary" : "bg-zinc-700"}`}>
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}

export default function PrinterSettingsPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const [printers, setPrinters] = useState([]);
  const [savedPrinters, setSavedPrinters] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_PRINTER);
  const [fieldErrors, setFieldErrors] = useState(EMPTY_PRINTER_ERRORS);
  const [formError, setFormError] = useState("");
  const [testing, setTesting] = useState("");
  const [testResult, setTestResult] = useState({});

  const hasChanges = JSON.stringify(printers) !== JSON.stringify(savedPrinters);

  const loadPrinters = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch("/api/printer-settings", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setLoadError(data.error ?? "Failed to load printer settings.");
        return;
      }
      const list = Array.isArray(data.printers) ? data.printers : [];
      setPrinters(list);
      setSavedPrinters(list);
    } catch {
      setLoadError("Could not load printer settings. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrinters();
  }, [loadPrinters]);

  async function savePrinters(nextList = printers) {
    setSaving(true);
    setSaveResult(null);
    try {
      const res = await fetch("/api/printer-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ printers: nextList }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setSaveResult({ success: false, message: data.error ?? "Failed to save." });
        return false;
      }
      const list = Array.isArray(data.printers) ? data.printers : nextList;
      setPrinters(list);
      setSavedPrinters(list);
      setSaveResult({ success: true, message: "Printer settings saved." });
      setTimeout(() => setSaveResult(null), 3000);
      return true;
    } catch {
      setSaveResult({ success: false, message: "Network error." });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function addPrinter() {
    const validation = getPrinterFieldErrors(form);
    setFieldErrors(validation.errors);
    if (!validation.valid) {
      setFormError(validation.message ?? "Fix the highlighted fields.");
      return;
    }
    setFormError("");
    const entry = { ...form, id: crypto.randomUUID() };
    const next = [...printers, entry];
    setPrinters(next);
    setForm(EMPTY_PRINTER);
    setShowForm(false);
    await savePrinters(next);
  }

  async function removePrinter(id) {
    const next = printers.filter((p) => p.id !== id);
    setPrinters(next);
    setTestResult((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    await savePrinters(next);
  }

  async function testPrint(printer) {
    setTesting(printer.id);
    setTestResult((prev) => ({ ...prev, [printer.id]: null }));
    try {
      const res = await fetch("/api/printer-settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ printer }),
      });
      const data = await res.json();
      setTestResult((prev) => ({
        ...prev,
        [printer.id]: {
          success: Boolean(data.success),
          message: data.message ?? data.error ?? "Unknown result.",
        },
      }));
    } catch {
      setTestResult((prev) => ({
        ...prev,
        [printer.id]: { success: false, message: "Network error." },
      }));
    } finally {
      setTesting("");
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-ra-primary" />
      </div>
    );
  }

  return (
    <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`mt-1 shrink-0 ${raIconBadgeCls}`}>
            <Printer className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="admin-page-title text-xl font-semibold tracking-tight sm:text-2xl">{t("printer.title")}</h1>
            <p className="admin-page-desc mt-1 text-sm">
              Configure thermal printers. Network printers print via ESC/POS; USB/Bluetooth use POS browser print.
            </p>
          </div>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
          <button type="button" onClick={() => savePrinters()} disabled={saving || !hasChanges}
            className="cursor-pointer inline-flex w-full items-center justify-center gap-2 rounded-xl border admin-shell-border px-4 py-2 text-sm font-semibold admin-shell-text transition-colors hover:border-zinc-500 disabled:opacity-50 sm:w-auto">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={() => setShowForm(true)}
            className="cursor-pointer inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ra-primary px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:brightness-110 sm:w-auto">
            <Plus className="size-4" /> {t("printer.addPrinter")}
          </button>
        </div>
      </div>

      {loadError && (
        <div className="flex min-w-0 items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <XCircle className="size-4 shrink-0" />
          {loadError}
        </div>
      )}

      {saveResult && (
        <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
          saveResult.success
            ? "border-ra-primary-25 bg-ra-primary-10 text-ra-primary"
            : "border-red-500/25 bg-red-500/10 text-red-400"
        }`}>
          {saveResult.success ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
          {saveResult.message}
        </div>
      )}

      {showForm && (
        <section className="admin-surface-card p-4 sm:p-5">
          <h2 className="mb-4 text-base font-semibold admin-shell-text">Add New Printer</h2>
          {formError && (
            <p className="mb-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {formError}
            </p>
          )}
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">{t("printer.printerName")}</label>
                <input
                  value={form.name}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, name: e.target.value }));
                    if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: "" }));
                  }}
                  placeholder="e.g. Kitchen Printer"
                  aria-invalid={fieldErrors.name ? true : undefined}
                  className={`${inputCls} ${fieldErrors.name ? "border-red-500/50" : ""}`}
                />
                {fieldErrors.name && <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">Printer Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {PRINTER_TYPES.map((pt) => (
                    <button key={pt.id} type="button" onClick={() => setForm((f) => ({ ...f, type: pt.id }))}
                      className={`cursor-pointer min-w-0 rounded-xl border px-1.5 py-2 text-[10px] font-medium transition-all sm:px-2 sm:text-xs ${
                        form.type === pt.id ? `${pt.bg} ${pt.color} ring-1` : "border admin-shell-border bg-[var(--admin-surface)] text-[var(--admin-text-secondary)] hover:bg-[var(--admin-hover)]"
                      }`}>
                      <pt.Icon className="mx-auto mb-1 size-4" />
                      <span className="block truncate">{pt.id === "network" ? "LAN" : pt.id === "bluetooth" ? "BT" : "USB"}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {form.type === "network" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">{t("printer.ipAddress")}</label>
                  <input
                    value={form.ipAddress}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, ipAddress: e.target.value }));
                      if (fieldErrors.ipAddress) setFieldErrors((p) => ({ ...p, ipAddress: "" }));
                    }}
                    placeholder="192.168.1.100"
                    aria-invalid={fieldErrors.ipAddress ? true : undefined}
                    className={`${inputCls} ${fieldErrors.ipAddress ? "border-red-500/50" : ""}`}
                  />
                  {fieldErrors.ipAddress && (
                    <p className="mt-1 text-xs text-red-400">{fieldErrors.ipAddress}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">{t("printer.port")}</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={65535}
                    value={form.port}
                    onChange={(e) => setForm((f) => ({ ...f, port: e.target.value }))}
                    placeholder="9100"
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">{t("printer.paperSize")}</label>
                <div className="flex gap-2">
                  {PAPER_SIZES.map((size) => (
                    <button key={size} type="button" onClick={() => setForm((f) => ({ ...f, paperSize: size }))}
                      className={`cursor-pointer flex-1 rounded-xl border py-2 text-sm font-semibold transition-all ${
                        form.paperSize === size
                          ? "border-ra-primary-40 bg-ra-primary-15 text-ra-primary"
                          : "border admin-shell-border bg-[var(--admin-surface)] text-[var(--admin-text-secondary)] hover:bg-[var(--admin-hover)]"
                      }`}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Toggle label={t("printer.autoPrint")} hint="Auto-print on POS order"
                checked={form.autoPrint} onChange={(v) => setForm((f) => ({ ...f, autoPrint: v }))} />
              <Toggle label={t("printer.printKot")} hint="Kitchen Order Ticket"
                checked={form.printKot} onChange={(v) => setForm((f) => ({ ...f, printKot: v }))} />
              <Toggle label={t("printer.printInvoice")} hint="Customer bill"
                checked={form.printInvoice} onChange={(v) => setForm((f) => ({ ...f, printInvoice: v }))} />
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setShowForm(false)}
                className="cursor-pointer w-full rounded-xl border admin-shell-border px-4 py-2 text-sm admin-surface-muted transition-colors hover:admin-shell-text sm:w-auto">
                Cancel
              </button>
              <button type="button" onClick={addPrinter} disabled={saving}
                className="cursor-pointer w-full rounded-xl bg-ra-primary px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:brightness-110 disabled:opacity-50 sm:w-auto">
                Add Printer
              </button>
            </div>
          </div>
        </section>
      )}

      {printers.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed admin-shell-border px-4 py-16 text-center sm:py-20">
          <Printer className="size-10 text-zinc-700" />
          <p className="text-sm admin-surface-muted">No printers configured yet.</p>
          <p className="text-xs admin-surface-faint">Add a printer — settings are saved to your restaurant account.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {printers.map((printer) => {
            const pt = PRINTER_TYPES.find((p) => p.id === printer.type);
            const result = testResult[printer.id];
            return (
              <div key={printer.id} className="admin-surface-card p-4 sm:p-5">
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${pt?.bg ?? "admin-surface-card admin-shell-border"}`}>
                      {pt && <pt.Icon className={`size-5 ${pt.color}`} />}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold admin-shell-text">{printer.name}</p>
                      <p className="break-words text-xs admin-surface-muted">
                        {pt?.label} · {printer.paperSize}
                        {printer.type === "network" && printer.ipAddress && (
                          <>
                            <span className="hidden sm:inline"> · </span>
                            <span className="block sm:inline">{printer.ipAddress}:{printer.port}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 self-stretch sm:self-auto">
                    {result && (
                      result.success
                        ? <CheckCircle2 className="size-4 shrink-0 text-ra-primary" title={result.message} />
                        : <XCircle className="size-4 shrink-0 text-red-400" title={result.message} />
                    )}
                    <button type="button" onClick={() => testPrint(printer)} disabled={testing === printer.id}
                      className="cursor-pointer inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border admin-shell-border px-3 py-1.5 text-xs font-medium admin-surface-body transition-colors hover:border-zinc-500 disabled:opacity-50 sm:flex-none">
                      {testing === printer.id ? <Loader2 className="size-3 animate-spin" /> : <Printer className="size-3 shrink-0" />}
                      <span className="truncate">{testing === printer.id ? "Testing…" : t("printer.testPrint")}</span>
                    </button>
                    <button type="button" onClick={() => removePrinter(printer.id)} disabled={saving}
                      className="cursor-pointer flex size-8 shrink-0 items-center justify-center rounded-xl border admin-shell-border text-zinc-600 transition-colors hover:border-red-500/40 hover:text-red-400">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {result?.message && (
                  <p className={`mt-2 text-xs ${result.success ? "text-ra-primary" : "text-red-400"}`}>
                    {result.message}
                  </p>
                )}

                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <Toggle label={t("printer.autoPrint")} checked={Boolean(printer.autoPrint)}
                    onChange={(v) => setPrinters((prev) => prev.map((p) => p.id === printer.id ? { ...p, autoPrint: v } : p))} />
                  <Toggle label={t("printer.printKot")} checked={Boolean(printer.printKot)}
                    onChange={(v) => setPrinters((prev) => prev.map((p) => p.id === printer.id ? { ...p, printKot: v } : p))} />
                  <Toggle label={t("printer.printInvoice")} checked={Boolean(printer.printInvoice)}
                    onChange={(v) => setPrinters((prev) => prev.map((p) => p.id === printer.id ? { ...p, printInvoice: v } : p))} />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {printer.autoPrint && <span className="rounded-full bg-ra-primary-15 px-2.5 py-0.5 text-xs text-ra-primary">Auto Print</span>}
                  {printer.printKot && <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs text-blue-400">KOT</span>}
                  {printer.printInvoice && <span className="rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs text-violet-400">Invoice</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <section className="admin-surface-card p-4 sm:p-5">
        <h2 className="mb-3 text-base font-semibold admin-shell-text">How printing works</h2>
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Network (LAN)", desc: "Server sends ESC/POS to printer IP:9100. App server must be on same WiFi/LAN.", icon: "📡" },
            { label: "USB / Bluetooth", desc: "Use POS → Print Bill. Browser print dialog sends to your connected printer.", icon: "🖨️" },
            { label: "Auto Print", desc: "When enabled, POS prints invoice/KOT automatically after each order.", icon: "⚡" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl admin-surface-card p-3">
              <div className="text-xl mb-1">{item.icon}</div>
              <p className="font-medium admin-shell-text">{item.label}</p>
              <p className="mt-0.5 text-xs admin-surface-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
