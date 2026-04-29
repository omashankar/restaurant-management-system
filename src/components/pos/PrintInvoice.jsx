"use client";

import { Printer } from "lucide-react";

/**
 * PrintInvoice
 * Renders a print-ready invoice and triggers window.print().
 *
 * Props:
 *   orderId      {string}
 *   orderType    {string}
 *   tableNumber  {string|null}
 *   customer     {string}
 *   items        {Array<{name, qty, price}>}
 *   subtotal     {number}
 *   tax          {number}
 *   total        {number}
 *   restaurantName {string}
 */
export default function PrintInvoice({
  orderId,
  orderType,
  tableNumber,
  customer,
  items = [],
  subtotal,
  tax,
  total,
  restaurantName = "Restaurant",
}) {
  function handlePrint() {
    const date = new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const rows = items
      .map(
        (i) =>
          `<tr>
            <td style="padding:4px 0;font-size:13px">${i.name}</td>
            <td style="padding:4px 0;font-size:13px;text-align:center">${i.qty}</td>
            <td style="padding:4px 0;font-size:13px;text-align:right">$${(i.price * i.qty).toFixed(2)}</td>
          </tr>`
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>Invoice ${orderId}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Courier New', monospace; width: 300px; margin: 0 auto; padding: 16px; color: #111; }
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
        </style>
      </head>
      <body>
        <h1>${restaurantName}</h1>
        <p class="sub">${date}</p>
        <div class="divider"></div>
        <table>
          <tr><td style="font-size:12px;color:#555">Order</td><td colspan="2" style="font-size:12px;text-align:right">${orderId}</td></tr>
          <tr><td style="font-size:12px;color:#555">Type</td><td colspan="2" style="font-size:12px;text-align:right;text-transform:capitalize">${orderType}</td></tr>
          ${tableNumber ? `<tr><td style="font-size:12px;color:#555">Table</td><td colspan="2" style="font-size:12px;text-align:right">${tableNumber}</td></tr>` : ""}
          <tr><td style="font-size:12px;color:#555">Customer</td><td colspan="2" style="font-size:12px;text-align:right">${customer}</td></tr>
        </table>
        <div class="divider"></div>
        <table>
          <thead>
            <tr>
              <th style="text-align:left">Item</th>
              <th>Qty</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="divider"></div>
        <table class="totals">
          <tr><td>Subtotal</td><td style="text-align:right">$${subtotal.toFixed(2)}</td></tr>
          <tr><td>Tax (8%)</td><td style="text-align:right">$${tax.toFixed(2)}</td></tr>
          <tr class="grand"><td>Total</td><td style="text-align:right">$${total.toFixed(2)}</td></tr>
        </table>
        <p class="footer">Thank you for dining with us!</p>
      </body>
      </html>
    `;

    const win = window.open("", "_blank", "width=360,height=600");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
    >
      <Printer className="size-4" />
      Print Bill
    </button>
  );
}
