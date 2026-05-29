/**
 * POST /api/printer-settings/print — send invoice or KOT to a network printer (ESC/POS)
 */
import { withTenant } from "@/lib/tenantDb";
import {
  buildEscPosInvoice,
  buildEscPosKot,
  sanitizePrinter,
  sendToNetworkPrinter,
} from "@/lib/networkPrinter";

export const POST = withTenant(
  ["admin", "manager", "waiter"],
  async ({ db, restaurantId }, request) => {
    const body = await request.json();
    const printer = sanitizePrinter(body.printer ?? {});
    const kind = body.kind === "kot" ? "kot" : "invoice";
    const restaurantName = String(body.restaurantName ?? "Restaurant").trim() || "Restaurant";

    if (printer.type !== "network") {
      return Response.json({ success: false, error: "Only network printers support server-side printing." }, { status: 400 });
    }
    if (!printer.ipAddress) {
      return Response.json({ success: false, error: "Printer IP address missing." }, { status: 400 });
    }

    let data;
    if (kind === "kot") {
      data = buildEscPosKot({
        orderId: body.order?.orderId,
        orderType: body.order?.orderType,
        tableNumber: body.order?.tableNumber,
        customer: body.order?.customer,
        kitchenRouting: body.kitchenRouting ?? {},
        paperSize: printer.paperSize,
      });
    } else {
      data = buildEscPosInvoice(body.order ?? {}, { restaurantName, paperSize: printer.paperSize });
    }

    try {
      await sendToNetworkPrinter({
        host: printer.ipAddress,
        port: printer.port,
        data,
      });
      return Response.json({ success: true });
    } catch (err) {
      return Response.json({ success: false, error: err.message ?? "Print failed." }, { status: 400 });
    }
  }
);
