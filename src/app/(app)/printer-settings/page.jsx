"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Loader2, Plus, Printer, Trash2, Wifi, Bluetooth, Usb, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";

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
  const [printers, setPrinters] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_PRINTER);
  const [testing, setTesting] = useState("");
  const [testResult, setTestResult] = useState({});

  function addPrinter() {
    if (!form.name) return;
    setPrinters((prev) => [...prev, { ...form, id: Date.now().toString() }]);
    setForm(EMPTY_PRINTER);
    setShowForm(false);
  }

  function removePrinter(id) {
    setPrinters((prev) => prev.filter((p) => p.id !== id));
  }

  async function testPrint(printer) {
    setTesting(printer.id);
    setTestResult((prev) => ({ ...prev, [printer.id]: null }));
    await new Promise((r) => setTimeout(r, 1500));
    // In production: send ESC/POS test command to printer
    const success = printer.type === "network" ? Boolean(printer.ipAddress) : true;
    setTestResult((prev) => ({ ...prev, [printer.id]: success }));
    setTesting("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">{t("printer.title")}</h1>
          <p className="mt-1 text-sm text-zinc-500">Configure thermal printers for invoices, KOT, and delivery slips.</p>
        </div>
        <button type="button" onClick={() => setShowForm(true)}
          className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors">
          <Plus className="size-4" /> {t("printer.addPrinter")}
        </button>
      </div>

      {/* Add printer form */}
      {showForm && (
        <section className="rounded-2xl border border-zinc-700 bg-zinc-900/60 p-5">
          <h2 className="mb-4 text-base font-semibold text-zinc-100">Add New Printer</h2>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">{t("printer.printerName")}</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Kitchen Printer" className={inputCls} />
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
                  <input value={form.ipAddress} onChange={(e) => setForm((f) => ({ ...f, ipAddress: e.target.value }))}
                    placeholder="192.168.1.100" className={inputCls} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">{t("printer.port")}</label>
                  <input value={form.port} onChange={(e) => setForm((f) => ({ ...f, port: e.target.value }))}
                    placeholder="9100" className={inputCls} />
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
              <Toggle label={t("printer.autoPrint")} hint="Print automatically on new order"
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
              <button type="button" onClick={addPrinter} disabled={!form.name}
                className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors">
                Add Printer
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Printer list */}
      {printers.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-800 py-20 text-center">
          <Printer className="size-10 text-zinc-700" />
          <p className="text-sm text-zinc-500">No printers configured yet.</p>
          <p className="text-xs text-zinc-600">Add a thermal printer to enable auto-printing of invoices and KOT.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {printers.map((printer) => {
            const pt = PRINTER_TYPES.find((p) => p.id === printer.type);
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
                    {testResult[printer.id] !== undefined && testResult[printer.id] !== null && (
                      testResult[printer.id]
                        ? <CheckCircle2 className="size-4 text-emerald-400" />
                        : <XCircle className="size-4 text-red-400" />
                    )}
                    <button type="button" onClick={() => testPrint(printer)} disabled={testing === printer.id}
                      className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-500 disabled:opacity-50 transition-colors">
                      {testing === printer.id ? <Loader2 className="size-3 animate-spin" /> : <Printer className="size-3" />}
                      {testing === printer.id ? "Testing…" : t("printer.testPrint")}
                    </button>
                    <button type="button" onClick={() => removePrinter(printer.id)}
                      className="cursor-pointer flex size-8 items-center justify-center rounded-xl border border-zinc-800 text-zinc-600 hover:border-red-500/40 hover:text-red-400 transition-colors">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
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

      {/* ESC/POS info */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h2 className="mb-3 text-base font-semibold text-zinc-100">ESC/POS Support</h2>
        <div className="grid gap-3 sm:grid-cols-3 text-sm">
          {[
            { label: "Customer Invoice", desc: "Full bill with items, tax, total", icon: "🧾" },
            { label: "Kitchen Order Ticket", desc: "KOT with table, items, notes", icon: "👨‍🍳" },
            { label: "Delivery Slip", desc: "Customer address and order details", icon: "🛵" },
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
