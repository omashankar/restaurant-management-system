"use client";

import { printInvoiceInBrowser } from "@/lib/posPrint";
import { Printer } from "lucide-react";

/**
 * PrintInvoice — browser print dialog for POS bills (USB / Bluetooth / default printer).
 */
export default function PrintInvoice({
  orderId,
  orderType,
  tableNumber,
  customer,
  items = [],
  subtotal,
  taxAmount = 0,
  taxPercent = 0,
  serviceCharge = 0,
  serviceChargePercent = 0,
  total,
  currency = "INR",
  restaurantName = "Restaurant",
  paperSize = "80mm",
}) {
  function handlePrint() {
    printInvoiceInBrowser(
      {
        orderId,
        orderType,
        tableNumber,
        customer,
        items,
        subtotal,
        taxAmount,
        taxPercent,
        serviceCharge,
        serviceChargePercent,
        total,
        currency,
      },
      { restaurantName, paperSize, currency }
    );
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 transition-colors hover-border-ra-primary-40 hover:text-ra-primary-muted"
    >
      <Printer className="size-4" />
      Print Bill
    </button>
  );
}
