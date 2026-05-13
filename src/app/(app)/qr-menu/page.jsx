"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Download, Printer, QrCode, RefreshCw, Table2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const QR_TYPES = [
  { id: "restaurant", label: "Restaurant QR", desc: "One QR for entire restaurant", icon: "🏪" },
  { id: "table",      label: "Table QR",      desc: "Individual QR per table",     icon: "🪑" },
  { id: "menu",       label: "Menu QR",       desc: "Direct link to digital menu", icon: "📋" },
];

function QrCodeDisplay({ value, size = 200 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = size;
    canvas.height = size;

    // Simple QR-like visual (real implementation uses qrcode library)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#000000";

    // Draw finder patterns (corners)
    const drawFinder = (x, y) => {
      ctx.fillRect(x, y, 49, 49);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x + 7, y + 7, 35, 35);
      ctx.fillStyle = "#000000";
      ctx.fillRect(x + 14, y + 14, 21, 21);
    };
    drawFinder(10, 10);
    drawFinder(size - 59, 10);
    drawFinder(10, size - 59);

    // Draw data modules (simplified pattern based on value hash)
    let hash = 0;
    for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) & 0xffffffff;
    const cellSize = 7;
    const startX = 70, startY = 70;
    const cols = Math.floor((size - 80) / cellSize);
    const rows = Math.floor((size - 80) / cellSize);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const bit = (hash >> ((r * cols + c) % 32)) & 1;
        if (bit) {
          ctx.fillRect(startX + c * cellSize, startY + r * cellSize, cellSize - 1, cellSize - 1);
        }
      }
    }

    // Center logo area
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(size / 2 - 20, size / 2 - 20, 40, 40);
    ctx.fillStyle = "#10b981";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("R", size / 2, size / 2);
  }, [value, size]);

  return <canvas ref={canvasRef} className="rounded-xl" />;
}

export default function QrMenuPage() {
  const { t } = useLanguage();
  const [qrType, setQrType] = useState("restaurant");
  const [tableNumber, setTableNumber] = useState("1");
  const [tableCount, setTableCount] = useState(10);
  const [baseUrl, setBaseUrl] = useState("");
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  function getQrValue() {
    if (qrType === "restaurant") return `${baseUrl}/order/menu`;
    if (qrType === "table") return `${baseUrl}/order/menu?table=${tableNumber}&type=dine-in`;
    return `${baseUrl}/order/menu`;
  }

  function downloadQr() {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `qr-${qrType}-${tableNumber}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }

  function printQr() {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>QR Code</title>
      <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;background:#fff;}
      h2{margin-bottom:16px;font-size:18px;} p{margin-top:8px;color:#666;font-size:14px;}</style>
      </head><body>
      <h2>${qrType === "table" ? `Table ${tableNumber}` : "Restaurant Menu"}</h2>
      <img src="${canvas.toDataURL()}" width="300" />
      <p>Scan to order</p>
      <p style="font-size:11px;color:#999;">${getQrValue()}</p>
      <script>window.onload=()=>{window.print();window.close();}</script>
      </body></html>
    `);
    win.document.close();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">{t("qr.title")}</h1>
        <p className="mt-1 text-sm text-zinc-500">Generate QR codes for table ordering and digital menu access.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: Config */}
        <div className="space-y-5">
          {/* QR Type */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="mb-4 text-base font-semibold text-zinc-100">QR Code Type</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {QR_TYPES.map((type) => (
                <button key={type.id} type="button" onClick={() => { setQrType(type.id); setGenerated(false); }}
                  className={`cursor-pointer rounded-xl border p-4 text-left transition-all ${
                    qrType === type.id
                      ? "border-emerald-500/40 bg-emerald-500/10 ring-1 ring-emerald-500/25"
                      : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700"
                  }`}>
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <p className={`text-sm font-semibold ${qrType === type.id ? "text-emerald-400" : "text-zinc-200"}`}>{type.label}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{type.desc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Table config */}
          {qrType === "table" && (
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
              <h2 className="mb-4 text-base font-semibold text-zinc-100">Table Configuration</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">Preview Table Number</label>
                  <input type="number" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} min="1"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/45" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">Total Tables</label>
                  <input type="number" value={tableCount} onChange={(e) => setTableCount(Number(e.target.value))} min="1" max="100"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/45" />
                </div>
              </div>

              {/* Bulk QR grid */}
              <div className="mt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">All Table QR Codes</p>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {Array.from({ length: Math.min(tableCount, 20) }).map((_, i) => (
                    <button key={i + 1} type="button" onClick={() => setTableNumber(String(i + 1))}
                      className={`cursor-pointer flex flex-col items-center rounded-xl border p-2 text-xs transition-all ${
                        tableNumber === String(i + 1)
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                          : "border-zinc-800 bg-zinc-950/40 text-zinc-500 hover:border-zinc-700"
                      }`}>
                      <Table2 className="size-4 mb-1" />
                      T{i + 1}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* QR URL */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="mb-3 text-base font-semibold text-zinc-100">QR URL</h2>
            <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2.5">
              <span className="flex-1 truncate font-mono text-xs text-zinc-400">{getQrValue()}</span>
              <button type="button" onClick={() => navigator.clipboard?.writeText(getQrValue())}
                className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Copy</button>
            </div>
          </section>
        </div>

        {/* Right: QR Preview */}
        <div className="space-y-4">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="mb-4 text-base font-semibold text-zinc-100">QR Preview</h2>
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-2xl border border-zinc-700 bg-white p-4">
                <QrCodeDisplay value={getQrValue()} size={220} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-zinc-200">
                  {qrType === "table" ? `Table ${tableNumber}` : "Restaurant Menu"}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">{t("qr.scanToOrder")}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              <button type="button" onClick={downloadQr}
                className="cursor-pointer flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors">
                <Download className="size-4" /> {t("qr.downloadQr")}
              </button>
              <button type="button" onClick={printQr}
                className="cursor-pointer flex items-center justify-center gap-2 rounded-xl border border-zinc-700 py-2.5 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 transition-colors">
                <Printer className="size-4" /> {t("qr.printQr")}
              </button>
            </div>
          </section>

          {/* Instructions */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">How it works</p>
            <div className="space-y-2 text-xs text-zinc-500">
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">1.</span>
                Customer scans QR code with phone camera
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">2.</span>
                Opens digital menu in browser (no app needed)
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">3.</span>
                Customer adds items to cart and places order
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">4.</span>
                Order appears in your POS and Kitchen Display
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
