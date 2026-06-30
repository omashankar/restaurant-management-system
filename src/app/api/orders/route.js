import { withTenant } from "@/lib/tenantDb";
import { logInfo } from "@/lib/logger";
import { buildPaginationMeta, paginationSkip, parseLimitParam, parsePageParam } from "@/lib/pagination";
import { redeemCoupon, validateCouponForOrder } from "@/lib/couponDb";
import { calculatePosTotals } from "@/lib/posTotals";
import { sendNewOrderAlertEmail } from "@/lib/emailService";
import { getRestaurantNotificationPrefs } from "@/lib/restaurantNotificationPrefs";
import { orderCreateSchema, parseSchema } from "@/lib/validationSchemas";
import { sendNewOrderAlertWhatsApp } from "@/lib/whatsappService";
import { ObjectId } from "mongodb";

/** Fetch restaurant tax/service-charge settings. Falls back to 0 if not set. */
async function fetchPosSettings(db, restaurantId) {
  const doc = await db.collection("restaurant_settings").findOne(
    { restaurantId },
    { projection: { pos: 1 } }
  ).catch(() => null);
  const pos = doc?.pos ?? {};
  return {
    taxPercent:           parseFloat(pos.taxPercentage ?? "0")    || 0,
    serviceChargePercent: parseFloat(pos.serviceCharge  ?? "0")   || 0,
    roundOffTotal:        Boolean(pos.roundOffTotal),
    enableDiscount:       Boolean(pos.enableDiscount),
  };
}

/* GET /api/orders */
export const GET = withTenant(
  ["admin", "manager", "waiter", "chef"],
  async ({ db, tenantFilter }, request) => {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const q = (searchParams.get("q") ?? "").trim();
    const sort = searchParams.get("sort") === "oldest" ? 1 : -1;
    const page = parsePageParam(searchParams.get("page"));
    const limit = parseLimitParam(searchParams.get("limit"), { defaultLimit: 12, maxLimit: 100 });
    const skip = paginationSkip(page, limit);

    const filter = { ...tenantFilter };
    if (status && status !== "all") filter.status = status;
    if (q) {
      filter.$or = [
        { orderId: { $regex: q, $options: "i" } },
        { customer: { $regex: q, $options: "i" } },
        { tableNumber: { $regex: q, $options: "i" } },
      ];
    }

    const col = db.collection("orders");
    const [orders, total, summaryRows] = await Promise.all([
      col.find(filter).sort({ createdAt: sort }).skip(skip).limit(limit).toArray(),
      col.countDocuments(filter),
      col.aggregate([
        { $match: tenantFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]).toArray(),
    ]);

    const summary = { new: 0, preparing: 0, ready: 0, completed: 0, cancelled: 0 };
    for (const row of summaryRows) {
      if (row._id && summary[row._id] !== undefined) summary[row._id] = row.count;
    }

    const pagination = buildPaginationMeta({ page, limit, total });

    return Response.json({
      success: true,
      orders: orders.map((o) => ({ ...o, id: o._id.toString(), _id: undefined })),
      pagination: { page: pagination.page, limit, total, pages: pagination.pages },
      summary,
    });
  }
);

/* POST /api/orders — create order */
export const POST = withTenant(
  ["admin", "manager", "waiter"],
  async ({ db, tenantFilter, restaurantId, payload }, request) => {
    const body = await request.json();
    let parsed;
    try {
      parsed = parseSchema(orderCreateSchema, body);
    } catch (err) {
      return Response.json({ success: false, error: err.message }, { status: 400 });
    }
    const { items, orderType, tableNumber, customer, notes, paymentMethod, paymentStatus } = parsed;

    const orderId  = `ORD-${Date.now()}`;
    const orderSubtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);

    // Use client-supplied breakdown if provided (POS sends it); otherwise read
    // from restaurant settings so server always stores correct values.
    let taxPercent           = parsed.taxPercent           ?? null;
    let serviceChargePercent = parsed.serviceChargePercent ?? null;
    const posSettings        = await fetchPosSettings(db, restaurantId);

    if (taxPercent === null) taxPercent = posSettings.taxPercent;
    if (serviceChargePercent === null) serviceChargePercent = posSettings.serviceChargePercent;

    let discountType = parsed.discountType ?? "none";
    let discountPercent = parsed.discountPercent ?? 0;
    let discountFixed = parsed.discountFixed ?? 0;
    let couponCode = String(parsed.couponCode ?? "").trim().toUpperCase() || null;
    let couponId = null;

    if (!posSettings.enableDiscount) {
      discountType = "none";
      discountPercent = 0;
      discountFixed = 0;
      couponCode = null;
    } else if (couponCode) {
      const itemQty = items.reduce((sum, item) => sum + Number(item.qty ?? 0), 0);
      const couponCheck = await validateCouponForOrder(db, restaurantId, couponCode, orderSubtotal, "pos", {
        orderType,
        paymentMethod: paymentMethod ?? "cashCounter",
        itemQty,
        hasOtherDiscount: discountType !== "none" && !couponCode,
      });
      if (!couponCheck.valid) {
        return Response.json({ success: false, error: couponCheck.error }, { status: 400 });
      }
      discountType = couponCheck.posDiscount.discountType;
      discountPercent = couponCheck.posDiscount.discountPercent;
      discountFixed = couponCheck.posDiscount.discountFixed;
      couponId = couponCheck.coupon?.id ?? null;
    }

    const totals = calculatePosTotals({
      items,
      taxPercent,
      serviceChargePercent,
      discountType,
      discountPercent,
      discountFixed,
      roundOffTotal: posSettings.roundOffTotal,
    });

    const {
      subtotal,
      discountAmount,
      taxableBase,
      taxAmount,
      serviceCharge: scAmount,
      total,
    } = totals;

    const method = paymentMethod ?? "cashCounter";
    const status =
      paymentStatus ??
      (method === "cod" || method === "payLater" ? "pending" : "paid");

    const doc = {
      ...tenantFilter,
      orderId,
      items,
      orderType,
      tableNumber: tableNumber ?? null,
      customer: customer?.trim() || "Walk-in",
      notes: notes?.trim() ?? "",
      subtotal,
      discountType: totals.discountType,
      discountPercent: totals.discountPercent,
      discountFixed: totals.discountFixed,
      discountAmount,
      couponCode,
      couponId: couponId ? new ObjectId(couponId) : null,
      couponDiscount: couponCode ? discountAmount : 0,
      taxableBase,
      taxPercent,
      taxAmount,
      serviceChargePercent,
      serviceCharge: scAmount,
      total,
      payment: { method, status },
      status: "new",
      createdBy: new ObjectId(payload.id),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("orders").insertOne(doc);
    if (couponId) {
      const redeemed = await redeemCoupon(db, restaurantId, couponId, {
        orderId: doc.orderId,
        orderMongoId: result.insertedId,
        channel: "pos",
        customerName: doc.customer,
        discountAmount: discountAmount,
        orderSubtotal: subtotal,
        orderTotal: total,
      });
      if (!redeemed.ok) {
        await db.collection("orders").deleteOne({ _id: result.insertedId });
        return Response.json({ success: false, error: redeemed.error }, { status: 400 });
      }
    }
    if (orderType === "dine-in" && tableNumber) {
      await db.collection("tables").updateOne(
        { ...tenantFilter, tableNumber },
        { $set: { status: "occupied", updatedAt: new Date() } }
      ).catch(() => {});
    }
    logInfo("order.created", { route: "/api/orders", orderId, actorId: payload.id, restaurantId });

    const [settingsDoc, notificationPrefs] = await Promise.all([
      db.collection("restaurant_settings").findOne(
        { restaurantId },
        { projection: { "general.restaurantName": 1 } }
      ).catch(() => null),
      getRestaurantNotificationPrefs(db, restaurantId),
    ]);

    if (notificationPrefs.smsNotifications) {
      sendNewOrderAlertWhatsApp({
        order: doc,
        db,
        restaurantId,
        restaurantName: settingsDoc?.general?.restaurantName ?? "Restaurant",
      }).catch(() => {});
    }

    if (notificationPrefs.emailNotifications && notificationPrefs.alertEmail) {
      sendNewOrderAlertEmail({
        order: doc,
        db,
        restaurantId,
        toEmail: notificationPrefs.alertEmail,
      }).catch(() => {});
    }

    return Response.json({
      success: true,
      order: { ...doc, id: result.insertedId.toString(), _id: undefined },
    }, { status: 201 });
  }
);
