import { withTenant } from "@/lib/tenantDb";
import { logInfo } from "@/lib/logger";
import { orderPatchSchema, parseSchema } from "@/lib/validationSchemas";
import { sendOrderWhatsApp, getOrderStatusWhatsAppEvent, sendNewOrderAlertWhatsApp } from "@/lib/whatsappService";
import { ObjectId } from "mongodb";

function getFilter(tenantFilter, id) {
  try { return { ...tenantFilter, _id: new ObjectId(id) }; }
  catch { return null; }
}

/* GET /api/orders/:id */
export const GET = withTenant(
  ["admin", "manager", "waiter", "chef"],
  async ({ db, tenantFilter }, request, { params }) => {
    const filter = getFilter(tenantFilter, params.id);
    if (!filter) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });
    const order = await db.collection("orders").findOne(filter);
    if (!order) return Response.json({ success: false, error: "Order not found." }, { status: 404 });
    return Response.json({ success: true, order: { ...order, id: order._id.toString(), _id: undefined } });
  }
);

/* PATCH /api/orders/:id — update status or fields */
export const PATCH = withTenant(
  ["admin", "manager", "waiter", "chef"],
  async ({ db, tenantFilter }, request, { params }) => {
    const filter = getFilter(tenantFilter, params.id);
    if (!filter) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

    const body = await request.json();
    let parsed;
    try {
      parsed = parseSchema(orderPatchSchema, body);
    } catch (err) {
      return Response.json({ success: false, error: err.message }, { status: 400 });
    }

    if (Object.keys(parsed).length === 0) {
      return Response.json({ success: false, error: "No valid fields to update." }, { status: 400 });
    }

    const existing = await db.collection("orders").findOne(filter);
    if (!existing) return Response.json({ success: false, error: "Order not found." }, { status: 404 });

    const { paymentStatus, ...rest } = parsed;
    const update = { ...rest, updatedAt: new Date() };
    if (paymentStatus) {
      update["payment.status"] = paymentStatus;
    }
    // Add timestamps for status transitions
    if (parsed.status === "preparing") update.preparingAt = new Date();
    if (parsed.status === "ready")     update.readyAt     = new Date();
    if (parsed.status === "completed") update.completedAt = new Date();
    if (parsed.status === "cancelled") update.cancelledAt = new Date();

    const result = await db.collection("orders").updateOne(filter, { $set: update });
    if (result.matchedCount === 0) return Response.json({ success: false, error: "Order not found." }, { status: 404 });
    if (parsed.status && existing.orderType === "dine-in" && existing.tableNumber) {
      const nextTableStatus = ["completed", "cancelled"].includes(parsed.status) ? "available" : "occupied";
      await db.collection("tables").updateOne(
        { ...tenantFilter, tableNumber: existing.tableNumber },
        { $set: { status: nextTableStatus, updatedAt: new Date() } }
      ).catch(() => {});
    }
    logInfo("order.updated", { route: "/api/orders/[id]", orderId: params.id, status: parsed.status ?? null });

    // ── WhatsApp triggers on status / payment change ──
    const mergedOrder = { ...existing, ...update };
    const settingsDoc = await db.collection("restaurant_settings").findOne(
      { restaurantId: existing.restaurantId },
      { projection: { "general.restaurantName": 1 } }
    ).catch(() => null);
    const restaurantName = settingsDoc?.general?.restaurantName ?? "Restaurant";

    if (parsed.status && existing.customerInfo?.phone) {
      const event = getOrderStatusWhatsAppEvent(parsed.status, existing.orderType);
      if (event) {
        sendOrderWhatsApp({
          event,
          order: mergedOrder,
          db,
          restaurantId: existing.restaurantId,
          restaurantName,
        }).catch(() => {});
      }
    }

    if (paymentStatus === "paid" && existing.customerInfo?.phone) {
      const prevPaid = existing.payment?.status === "paid";
      if (!prevPaid) {
        sendOrderWhatsApp({
          event: "payment_received",
          order: mergedOrder,
          db,
          restaurantId: existing.restaurantId,
          restaurantName,
        }).catch(() => {});
      }
    }

    return Response.json({ success: true });
  }
);

/* DELETE /api/orders/:id */
export const DELETE = withTenant(
  ["admin", "manager"],
  async ({ db, tenantFilter }, request, { params }) => {
    const filter = getFilter(tenantFilter, params.id);
    if (!filter) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });
    const result = await db.collection("orders").deleteOne(filter);
    if (result.deletedCount === 0) return Response.json({ success: false, error: "Order not found." }, { status: 404 });
    return Response.json({ success: true });
  }
);
