"use client";

import { Download, Printer, Table2, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import QRCode from "qrcode";

const QR_TYPES = [
  { id: "restaurant", label: "Restaurant QR", desc: "One QR for entire restaurant", icon: "🏪" },
  { id: "table",      label: "Table QR",      desc: "Individual QR per table",     icon: "🪑" },
  { id: "menu",       label: "Menu QR",       desc: "Direct link to digital menu", icon: "📋" },
];

// Real QR code using qrcode library
function RealQrCode({ value, size = 220, restaurantName = "" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H", // High — allows logo overlay
    }, (err) => {
      if (err) { console.error("QR error:", err); return; }

      // Draw restaurant name below QR on canvas
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");

      // Extend canvas height for label
      const labelHeight = restaurantName ? 36 : 0;
      const originalData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      canvas.height = size + labelHeight;
      ctx.putImageData(originalData, 0, 0);

      if (restaurantName) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, size, size, labelHeight);
        ctx.fillStyle = "#111111";
        ctx.font = "bold 13px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(restaurantName, size / 2, size + labelHeight / 2);
      }
    });
  }, [value, size, restaurantName]);

  return (
    <canvas
      ref={canvasRef}
      className="rounded-xl"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

export default function QrMenuPage() {
  const [qrType, setQrType]         = useState("restaurant");
  const [tableNumber, setTableNumber] = useState("1");
  const [tableCount, setTableCount]  = useState(10);
  const [baseUrl, setBaseUrl]        = useState("");
  const [restaurantName, setRestaurantName] = useState("My Restaurant");

  useEffect(() => {
    setBaseUrl(window.location.origin);
    // Try to get restaurant name from settings
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.settings?.general?.restaurantName) {
          setRestaurantName(d.settings.general.restaurantName);
        }
      })
      .catch(() => {});
  }, []);

  function getQrValue() {
    if (qrType === "table") {
      return `${baseUrl}/order/menu?table=${tableNumber}&type=dine-in`;
    }
    return `${baseUrl}/order/menu`;
  }

  function downloadQr() {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = qrType === "table"
      ? `qr-table-${tableNumber}.png`
      : `qr-${qrType}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function printQr() {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const imgData = canvas.toDataURL("image/png");
    const label = qrType === "table" ? `Table ${tableNumber}` : restaurantName;
    const win = window.open("", "_blank");
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Code — ${label}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            min-height: 100vh; font-family: Arial, sans-serif;
            background: #fff; padding: 24px;
          }
          .qr-wrap {
            border: 2px solid #e5e7eb; border-radius: 16px;
            padding: 20px; text-align: center;
          }
          img { display: block; width: 260px; height: auto; }
          h2 { margin-top: 12px; font-size: 18px; color: #111; }
          p { margin-top: 6px; font-size: 12px; color: #6b7280; }
          .url { margin-top: 8px; font-size: 10px; color: #9ca3af; word-break: break-all; }
        </style>
      </head>
      <body>
        <div class="qr-wrap">
          <img src="${imgData}" alt="QR Code" />
          <h2>${label}</h2>
          <p>Scan to order</p>
          <p class="url">${getQrValue()}</p>
        </div>
        <script>window.onload = () => { window.print(); window.close(); }</script>
      </body>
      </html>
    `);
    win.document.close();
  }

  // Bulk print all tables
  function printAllTables() {
    const urls = Array.from({ length: tableCount }, (_, i) =>
      `${baseUrl}/order/menu?table=${i + 1}&type=dine-in`
    );

    // Generate all QR codes as data URLs
    Promise.all(
      urls.map((url, i) =>
        QRCode.toDataURL(url, {
          width: 200, margin: 2,
          errorCorrectionLevel: "H",
          color: { dark: "#000000", light: "#ffffff" },
        }).then((dataUrl) => ({ dataUrl, table: i + 1 }))
      )
    ).then((results) => {
      const win = window.open("", "_blank");
      const items = results.map(({ dataUrl, table }) => `
        <div class="qr-item">
          <img src="${dataUrl}" alt="Table ${table}" />
          <p>Table ${table}</p>
          <small>${restaurantName}</small>
        </div>
      `).join("");

      win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>All Table QR Codes</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; background: #fff; padding: 16px; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
            .qr-item {
              border: 1px solid #e5e7eb; border-radius: 12px;
              padding: 12px; text-align: center; break-inside: avoid;
            }
            img { width: 100%; height: auto; display: block; }
            p { margin-top: 8px; font-size: 14px; font-weight: bold; color: #111; }
            small { font-size: 10px; color: #6b7280; }
            @media print {
              .grid { grid-template-columns: repeat(4, 1fr); }
            }
          </style>
        </head>
        <body>
          <div class="grid">${items}</div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
        </html>
      `);
      win.document.close();
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">QR Menu System</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Generate real scannable QR codes. Customers scan → menu opens → order placed.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Left: Config */}
        <div className="space-y-5">

          {/* QR Type */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="mb-4 text-base font-semibold text-zinc-100">QR Code Type</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {QR_TYPES.map((type) => (
                <button key={type.id} type="button"
                  onClick={() => setQrType(type.id)}
                  className={`cursor-pointer rounded-xl border p-4 text-left transition-all ${
                    qrType === type.id
                      ? "border-emerald-500/40 bg-emerald-500/10 ring-1 ring-emerald-500/25"
                      : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700"
                  }`}>
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <p className={`text-sm font-semibold ${qrType === type.id ? "text-emerald-400" : "text-zinc-200"}`}>
                    {type.label}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">{type.desc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Restaurant name */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="mb-3 text-base font-semibold text-zinc-100">Label on QR</h2>
            <input value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="Restaurant name shown below QR"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/45" />
          </section>

          {/* Table config */}
          {qrType === "table" && (
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
              <h2 className="mb-4 text-base font-semibold text-zinc-100">Table Configuration</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Preview Table
                  </label>
                  <input type="number" value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)} min="1"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/45" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Total Tables
                  </label>
                  <input type="number" value={tableCount}
                    onChange={(e) => setTableCount(Math.max(1, Math.min(50, Number(e.target.value))))}
                    min="1" max="50"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/45" />
                </div>
              </div>

              {/* Table grid */}
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Select Table to Preview
                </p>
                <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-8">
                  {Array.from({ length: Math.min(tableCount, 40) }).map((_, i) => (
                    <button key={i + 1} type="button"
                      onClick={() => setTableNumber(String(i + 1))}
                      className={`cursor-pointer flex flex-col items-center rounded-xl border py-2 text-xs transition-all ${
                        tableNumber === String(i + 1)
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                          : "border-zinc-800 bg-zinc-950/40 text-zinc-500 hover:border-zinc-700"
                      }`}>
                      <Table2 className="size-3.5 mb-0.5" />
                      T{i + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bulk print */}
              <div className="mt-4 flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-zinc-200">Print All {tableCount} Tables</p>
                  <p className="text-xs text-zinc-500">Print all table QR codes in one go (4 per row)</p>
                </div>
                <button type="button" onClick={printAllTables}
                  className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 transition-colors">
                  <Printer className="size-4" />
                  Print All
                </button>
              </div>
            </section>
          )}

          {/* QR URL */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="mb-3 text-base font-semibold text-zinc-100">QR URL</h2>
            <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2.5">
              <span className="flex-1 truncate font-mono text-xs text-zinc-400">{getQrValue()}</span>
              <button type="button"
                onClick={() => { navigator.clipboard?.writeText(getQrValue()); }}
                className="cursor-pointer shrink-0 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                Copy
              </button>
            </div>
          </section>
        </div>

        {/* Right: QR Preview */}
        <div className="space-y-4">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="mb-4 text-base font-semibold text-zinc-100">Live Preview</h2>

            <div className="flex flex-col items-center gap-4">
              {/* Real QR */}
              <div className="rounded-2xl border-2 border-zinc-200 bg-white p-4 shadow-lg">
                {baseUrl ? (
                  <RealQrCode
                    value={getQrValue()}
                    size={220}
                    restaurantName={restaurantName}
                  />
                ) : (
                  <div className="flex size-[220px] items-center justify-center">
                    <RefreshCw className="size-6 animate-spin text-zinc-400" />
                  </div>
                )}
              </div>

              <div className="text-center">
                <p className="text-sm font-semibold text-zinc-200">
                  {qrType === "table" ? `Table ${tableNumber}` : restaurantName}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">Scan to order</p>
                <p className="mt-1 text-[10px] text-zinc-600">
                  ✅ Real scannable QR code
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-5 grid gap-2">
              <button type="button" onClick={downloadQr}
                className="cursor-pointer flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors">
                <Download className="size-4" />
                Download QR (PNG)
              </button>
              <button type="button" onClick={printQr}
                className="cursor-pointer flex items-center justify-center gap-2 rounded-xl border border-zinc-700 py-2.5 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 transition-colors">
                <Printer className="size-4" />
                Print QR
              </button>
            </div>
          </section>

          {/* How it works */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">How it works</p>
            <div className="space-y-2.5">
              {[
                { step: "1", text: "Customer scans QR with phone camera" },
                { step: "2", text: "Menu opens in browser — no app needed" },
                { step: "3", text: "Customer adds items and places order" },
                { step: "4", text: "Order appears in POS & Kitchen Display" },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-2.5 text-xs text-zinc-500">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-400">
                    {step}
                  </span>
                  {text}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
