"use client";

import { useLanguage } from "@/context/LanguageContext";
import { CheckCircle2, Loader2, Plus, Printer, Save, Trash2, Wifi, Bluetooth, Usb, XCircle } from "lucide-react";
import { EMPTY_PRINTER_ERRORS, getPrinterFieldErrors } from "@/lib/formValidation";
import { useCallback, useEffect, useState } from "react";

const PRINTER_TYPES = [
  { id: "network", label: "Network (LAN/WiFi)", Icon: Wifi,      color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20" },
  { id: "bluetooth", label: "Bluetooth",        Icon: Bluetooth, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  { id: "usb",     label: "USB",                Icon: Usb,       color: "text-emerald-400",bg: "bg-emerald-500/10 border-emerald-500/20" },
];

const PAPER_SIZES = ["58mm", "80mm"];

const EMPTY_PRINTER = {
  name: "", type: "network", ipAddress: "", port: "9100",
  paperSize: "80mm", autoPrint: false, printKot: true, printInvoice: true,
};

const inputCls = "w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors focus:border-emerald-500/45 placeholder:text-zinc-600";

function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3">
      <span>
        <span className="block text-sm font-medium text-zinc-200">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-zinc-500">{hint}</span>}
      </span>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-zinc-700"}`}>
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
        <Loader2 className="size-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">{t("printer.title")}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Configure thermal printers. Network printers print via ESC/POS; USB/Bluetooth use POS browser print.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => savePrinters()} disabled={saving || !hasChanges}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-zinc-500 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={() => setShowForm(true)}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors">
            <Plus className="size-4" /> {t("printer.addPrinter")}
          </button>
        </div>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <XCircle className="size-4 shrink-0" />
          {loadError}
        </div>
      )}

      {saveResult && (
        <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
          saveResult.success
            ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
            : "border-red-500/25 bg-red-500/10 text-red-400"
        }`}>
          {saveResult.success ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
          {saveResult.message}
        </div>
      )}

      {showForm && (
        <section className="rounded-2xl border border-zinc-700 bg-zinc-900/60 p-5">
          <h2 className="mb-4 text-base font-semibold text-zinc-100">Add New Printer</h2>
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
                <div className="flex gap-2">
                  {PRINTER_TYPES.map((pt) => (
                    <button key={pt.id} type="button" onClick={() => setForm((f) => ({ ...f, type: pt.id }))}
                      className={`cursor-pointer flex-1 rounded-xl border px-2 py-2 text-xs font-medium transition-all ${
                        form.type === pt.id ? `${pt.bg} ${pt.color} ring-1` : "border-zinc-800 bg-zinc-950/40 text-zinc-500 hover:border-zinc-700"
                      }`}>
                      <pt.Icon className="mx-auto size-4 mb-1" />
                      {pt.id === "network" ? "LAN" : pt.label}
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
                          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                          : "border-zinc-800 bg-zinc-950/40 text-zinc-500 hover:border-zinc-700"
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

            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)}
                className="cursor-pointer rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
                Cancel
              </button>
              <button type="button" onClick={addPrinter} disabled={saving}
                className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors">
                Add Printer
              </button>
            </div>
          </div>
        </section>
      )}

      {printers.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-800 py-20 text-center">
          <Printer className="size-10 text-zinc-700" />
          <p className="text-sm text-zinc-500">No printers configured yet.</p>
          <p className="text-xs text-zinc-600">Add a printer — settings are saved to your restaurant account.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {printers.map((printer) => {
            const pt = PRINTER_TYPES.find((p) => p.id === printer.type);
            const result = testResult[printer.id];
            return (
              <div key={printer.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className={`flex size-10 items-center justify-center rounded-xl border ${pt?.bg ?? "bg-zinc-800 border-zinc-700"}`}>
                      {pt && <pt.Icon className={`size-5 ${pt.color}`} />}
                    </span>
                    <div>
                      <p className="font-semibold text-zinc-100">{printer.name}</p>
                      <p className="text-xs text-zinc-500">
                        {pt?.label} · {printer.paperSize}
                        {printer.type === "network" && printer.ipAddress && ` · ${printer.ipAddress}:${printer.port}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result && (
                      result.success
                        ? <CheckCircle2 className="size-4 text-emerald-400" title={result.message} />
                        : <XCircle className="size-4 text-red-400" title={result.message} />
                    )}
                    <button type="button" onClick={() => testPrint(printer)} disabled={testing === printer.id}
                      className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-500 disabled:opacity-50 transition-colors">
                      {testing === printer.id ? <Loader2 className="size-3 animate-spin" /> : <Printer className="size-3" />}
                      {testing === printer.id ? "Testing…" : t("printer.testPrint")}
                    </button>
                    <button type="button" onClick={() => removePrinter(printer.id)} disabled={saving}
                      className="cursor-pointer flex size-8 items-center justify-center rounded-xl border border-zinc-800 text-zinc-600 hover:border-red-500/40 hover:text-red-400 transition-colors">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {result?.message && (
                  <p className={`mt-2 text-xs ${result.success ? "text-emerald-400" : "text-red-400"}`}>
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
                  {printer.autoPrint && <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs text-emerald-400">Auto Print</span>}
                  {printer.printKot && <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs text-blue-400">KOT</span>}
                  {printer.printInvoice && <span className="rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs text-violet-400">Invoice</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h2 className="mb-3 text-base font-semibold text-zinc-100">How printing works</h2>
        <div className="grid gap-3 sm:grid-cols-3 text-sm">
          {[
            { label: "Network (LAN)", desc: "Server sends ESC/POS to printer IP:9100. App server must be on same WiFi/LAN.", icon: "📡" },
            { label: "USB / Bluetooth", desc: "Use POS → Print Bill. Browser print dialog sends to your connected printer.", icon: "🖨️" },
            { label: "Auto Print", desc: "When enabled, POS prints invoice/KOT automatically after each order.", icon: "⚡" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
              <div className="text-xl mb-1">{item.icon}</div>
              <p className="font-medium text-zinc-200">{item.label}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
