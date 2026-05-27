/**
 * Browser print helpers for POS (USB / Bluetooth / fallback).
 * Network thermal printers use /api/printer-settings/print from the server.
 */

export function paperWidthPx(paperSize) {
  return paperSize === "58mm" ? 220 : 300;
}

export function openPrintWindow(html, paperSize = "80mm") {
  const width = paperWidthPx(paperSize);
  const win = window.open("", "_blank", `width=${width + 60},height=700`);
  if (!win) {
    window.alert("Unable to open print preview. Allow popups for this site.");
    return false;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  win.onload = () => {
    win.onafterprint = () => win.close();
    win.print();
  };
  return true;
}

export function buildInvoiceHtml(order, { restaurantName = "Restaurant", paperSize = "80mm", currency } = {}) {
  const sym = currency ?? order.currency ?? "INR";
  const width = paperWidthPx(paperSize);
  const date = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  const rows = (order.items ?? [])
    .map(
      (i) =>
        `<tr>
          <td style="padding:4px 0;font-size:13px">${i.name}</td>
          <td style="padding:4px 0;font-size:13px;text-align:center">${i.qty}</td>
          <td style="padding:4px 0;font-size:13px;text-align:right">${sym} ${((i.price ?? 0) * (i.qty ?? 1)).toFixed(2)}</td>
        </tr>`
    )
    .join("");

  const taxLabel = order.taxPercent > 0 ? `Tax (${order.taxPercent}%)` : "Tax";
  const scLabel = order.serviceChargePercent > 0 ? `Service (${order.serviceChargePercent}%)` : "Service";
  const taxRow =
    Number(order.taxAmount) > 0
      ? `<tr><td>${taxLabel}</td><td style="text-align:right">${sym} ${Number(order.taxAmount).toFixed(2)}</td></tr>`
      : "";
  const scRow =
    Number(order.serviceCharge) > 0
      ? `<tr><td>${scLabel}</td><td style="text-align:right">${sym} ${Number(order.serviceCharge).toFixed(2)}</td></tr>`
      : "";

  return `
    <!DOCTYPE html><html><head><meta charset="utf-8"/><title>Invoice ${order.orderId}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Courier New', monospace; width: ${width}px; margin: 0 auto; padding: 16px; color: #111; }
      h1 { font-size: 18px; text-align: center; margin-bottom: 2px; }
      .sub { font-size: 11px; text-align: center; color: #555; margin-bottom: 12px; }
      .divider { border-top: 1px dashed #999; margin: 8px 0; }
      table { width: 100%; border-collapse: collapse; }
      th { font-size: 11px; text-transform: uppercase; color: #555; padding: 4px 0; border-bottom: 1px solid #ccc; }
      th:last-child, td:last-child { text-align: right; }
      th:nth-child(2), td:nth-child(2) { text-align: center; }
      .totals td { padding: 3px 0; font-size: 13px; }
      .totals .grand td { font-size: 15px; font-weight: bold; border-top: 1px solid #111; padding-top: 6px; }
      .footer { text-align: center; font-size: 11px; color: #777; margin-top: 14px; }
      @media print { @page { margin: 0; } body { padding: 8px; } }
    </style></head><body>
      <h1>${restaurantName}</h1><p class="sub">${date}</p><div class="divider"></div>
      <table>
        <tr><td style="font-size:12px;color:#555">Order</td><td colspan="2" style="font-size:12px;text-align:right">${order.orderId}</td></tr>
        <tr><td style="font-size:12px;color:#555">Type</td><td colspan="2" style="font-size:12px;text-align:right;text-transform:capitalize">${order.orderType}</td></tr>
        ${order.tableNumber ? `<tr><td style="font-size:12px;color:#555">Table</td><td colspan="2" style="font-size:12px;text-align:right">${order.tableNumber}</td></tr>` : ""}
        <tr><td style="font-size:12px;color:#555">Customer</td><td colspan="2" style="font-size:12px;text-align:right">${order.customer ?? "—"}</td></tr>
      </table>
      <div class="divider"></div>
      <table><thead><tr><th style="text-align:left">Item</th><th>Qty</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="divider"></div>
      <table class="totals">
        <tr><td>Subtotal</td><td style="text-align:right">${sym} ${Number(order.subtotal ?? 0).toFixed(2)}</td></tr>
        ${taxRow}${scRow}
        <tr class="grand"><td>Total</td><td style="text-align:right">${sym} ${Number(order.total ?? 0).toFixed(2)}</td></tr>
      </table>
      <p class="footer">Thank you!</p>
    </body></html>`;
}

export function buildKotHtml({ orderId, orderType, tableNumber, customer, kitchenRouting, paperSize = "80mm" }) {
  const width = paperWidthPx(paperSize);
  const sections = Object.entries(kitchenRouting ?? {})
    .map(([k, items]) => {
      const rows = (items ?? [])
        .map(
          (i) =>
            `<tr><td>${i.qty}x ${i.name}</td><td style="font-size:11px;color:#555">${i.note ?? ""}</td></tr>`
        )
        .join("");
      return `<p style="font-weight:bold;margin-top:8px">${k.replace(/_/g, " ")}</p><table>${rows}</table>`;
    })
    .join("");

  return `
    <!DOCTYPE html><html><head><meta charset="utf-8"/><title>KOT ${orderId}</title>
    <style>
      body { font-family: 'Courier New', monospace; width: ${width}px; margin: 0 auto; padding: 12px; }
      h1 { text-align: center; font-size: 16px; }
      .meta { font-size: 12px; margin: 8px 0; }
      table { width: 100%; font-size: 13px; }
      @media print { @page { margin: 0; } }
    </style></head><body>
      <h1>KITCHEN ORDER</h1>
      <div class="meta">Order: ${orderId} · ${orderType}${tableNumber ? ` · Table ${tableNumber}` : ""}<br/>${customer ?? ""} · ${new Date().toLocaleTimeString()}</div>
      ${sections}
    </body></html>`;
}

export function printInvoiceInBrowser(order, opts = {}) {
  return openPrintWindow(buildInvoiceHtml(order, opts), opts.paperSize);
}

export function printKotInBrowser(payload, paperSize = "80mm") {
  return openPrintWindow(buildKotHtml({ ...payload, paperSize }), paperSize);
}

/** Fire network API prints + at most one browser print dialog for USB/BT. */
export async function triggerPosAutoPrint({
  printers = [],
  restaurantName = "Restaurant",
  lastOrder,
  kitchenRouting = {},
}) {
  const active = printers.filter((p) => p.autoPrint);
  if (!active.length || !lastOrder) return;

  for (const p of active) {
    if (p.type !== "network" || !p.ipAddress) continue;
    const jobs = [];
    if (p.printInvoice) jobs.push({ kind: "invoice" });
    if (p.printKot) jobs.push({ kind: "kot" });
    for (const job of jobs) {
      fetch("/api/printer-settings/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          printer: p,
          kind: job.kind,
          order: lastOrder,
          kitchenRouting,
          restaurantName,
        }),
      }).catch(() => {});
    }
  }

  const browserPrinter = active.find((p) => p.type !== "network");
  if (!browserPrinter) return;

  if (browserPrinter.printInvoice) {
    printInvoiceInBrowser(lastOrder, {
      restaurantName,
      paperSize: browserPrinter.paperSize,
      currency: lastOrder.currency,
    });
  } else if (browserPrinter.printKot) {
    printKotInBrowser(
      {
        orderId: lastOrder.orderId,
        orderType: lastOrder.orderType,
        tableNumber: lastOrder.tableNumber,
        customer: lastOrder.customer,
        kitchenRouting,
      },
      browserPrinter.paperSize
    );
  }
}
