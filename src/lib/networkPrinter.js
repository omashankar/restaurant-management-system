import net from "node:net";
import { randomUUID } from "node:crypto";

const ESC = "\x1B";
const GS = "\x1D";

/** Send raw bytes to a network thermal printer (ESC/POS port, usually 9100). */
export function sendToNetworkPrinter({ host, port = 9100, data, timeoutMs = 8000 }) {
  const portNum = Number(port) || 9100;
  if (!host?.trim()) {
    return Promise.reject(new Error("IP address is required."));
  }

  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (err, value) => {
      if (settled) return;
      settled = true;
      try {
        socket.destroy();
      } catch {
        /* ignore */
      }
      if (err) reject(err);
      else resolve(value);
    };

    socket.setTimeout(timeoutMs);
    socket.on("timeout", () => finish(new Error("Printer connection timed out. Check IP, port, and that the server can reach the printer on your LAN.")));
    socket.on("error", (err) => finish(err));
    socket.connect(portNum, host.trim(), () => {
      const buf = Buffer.isBuffer(data) ? data : Buffer.from(data, "utf8");
      socket.write(buf, (err) => {
        if (err) finish(err);
        else finish(null, { success: true });
      });
    });
  });
}

function lineWidth(paperSize) {
  return paperSize === "58mm" ? 32 : 48;
}

function padLine(left, right, width) {
  const l = String(left ?? "");
  const r = String(right ?? "");
  const space = Math.max(1, width - l.length - r.length);
  return l + " ".repeat(space) + r;
}

function divider(width) {
  return "-".repeat(width) + "\n";
}

/** Build ESC/POS test slip. */
export function buildEscPosTest({ restaurantName = "Restaurant" } = {}) {
  const chunks = [
    `${ESC}@`,
    `${ESC}a\x01`,
    `${restaurantName}\n`,
    `${ESC}a\x00`,
    "Test Print\n",
    `RMS · ${new Date().toLocaleString()}\n`,
    divider(32),
    "Printer connection OK\n\n",
    `${GS}V\x00`,
  ];
  return Buffer.from(chunks.join(""), "utf8");
}

/** Build ESC/POS invoice bytes. */
export function buildEscPosInvoice(order, { restaurantName = "Restaurant", paperSize = "80mm" } = {}) {
  const w = lineWidth(paperSize);
  const sym = order.currency ?? "INR";
  const lines = [
    `${ESC}@`,
    `${ESC}a\x01`,
    `${restaurantName}\n`,
    `${ESC}a\x00`,
    `${new Date().toLocaleString()}\n`,
    divider(w),
    padLine("Order", order.orderId ?? "—", w) + "\n",
    padLine("Type", order.orderType ?? "—", w) + "\n",
  ];
  if (order.tableNumber) lines.push(padLine("Table", order.tableNumber, w) + "\n");
  lines.push(padLine("Customer", order.customer ?? "—", w) + "\n", divider(w));
  for (const item of order.items ?? []) {
    const amt = ((item.price ?? 0) * (item.qty ?? 1)).toFixed(2);
    lines.push(`${item.name ?? "Item"}\n`);
    lines.push(padLine(`  x${item.qty ?? 1}`, `${sym} ${amt}`, w) + "\n");
  }
  lines.push(
    divider(w),
    padLine("Subtotal", `${sym} ${Number(order.subtotal ?? 0).toFixed(2)}`, w) + "\n",
  );
  if (Number(order.taxAmount) > 0) {
    const taxLbl = order.taxPercent > 0 ? `Tax (${order.taxPercent}%)` : "Tax";
    lines.push(padLine(taxLbl, `${sym} ${Number(order.taxAmount).toFixed(2)}`, w) + "\n");
  }
  if (Number(order.serviceCharge) > 0) {
    const scLbl = order.serviceChargePercent > 0 ? `Svc (${order.serviceChargePercent}%)` : "Service";
    lines.push(padLine(scLbl, `${sym} ${Number(order.serviceCharge).toFixed(2)}`, w) + "\n");
  }
  lines.push(
    padLine("TOTAL", `${sym} ${Number(order.total ?? 0).toFixed(2)}`, w) + "\n",
    divider(w),
    `${ESC}a\x01Thank you!\n\n`,
    `${GS}V\x00`,
  );
  return Buffer.from(lines.join(""), "utf8");
}

/** Build ESC/POS kitchen ticket bytes. */
export function buildEscPosKot({ orderId, orderType, tableNumber, customer, kitchenRouting, paperSize = "80mm" }) {
  const w = lineWidth(paperSize);
  const lines = [
    `${ESC}@`,
    `${ESC}a\x01** KITCHEN **\n`,
    `${ESC}a\x00`,
    padLine("Order", orderId ?? "—", w) + "\n",
    padLine("Type", orderType ?? "—", w) + "\n",
  ];
  if (tableNumber) lines.push(padLine("Table", tableNumber, w) + "\n");
  if (customer) lines.push(padLine("Customer", customer, w) + "\n");
  lines.push(divider(w), `${new Date().toLocaleTimeString()}\n`, divider(w));

  for (const [kitchen, items] of Object.entries(kitchenRouting ?? {})) {
    lines.push(`${kitchen.replace(/_/g, " ").toUpperCase()}\n`);
    for (const item of items ?? []) {
      lines.push(` ${item.qty}x ${item.name}\n`);
      if (item.note) lines.push(`    Note: ${item.note}\n`);
    }
    lines.push("\n");
  }
  lines.push(`${GS}V\x00`);
  return Buffer.from(lines.join(""), "utf8");
}

export function sanitizePrinter(p) {
  const type = ["network", "bluetooth", "usb"].includes(p?.type) ? p.type : "network";
  return {
    id: String(p?.id ?? randomUUID()),
    name: String(p?.name ?? "").trim(),
    type,
    ipAddress: String(p?.ipAddress ?? "").trim(),
    port: String(p?.port ?? "9100").trim() || "9100",
    paperSize: p?.paperSize === "58mm" ? "58mm" : "80mm",
    autoPrint: Boolean(p?.autoPrint),
    printKot: Boolean(p?.printKot),
    printInvoice: Boolean(p?.printInvoice),
  };
}

export function sanitizePrinters(list) {
  if (!Array.isArray(list)) return [];
  return list.map(sanitizePrinter).filter((p) => p.name);
}
