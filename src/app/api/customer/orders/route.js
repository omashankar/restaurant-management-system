import clientPromise from "@/lib/mongodb";
import { normalizeCustomerOrderStatus } from "@/lib/customerOrderStatus";
import { getCustomerTokenFromRequest, verifyCustomerToken } from "@/lib/customerAuth";
import { logError, logInfo } from "@/lib/logger";
import { createGatewayPaymentSession } from "@/lib/paymentGateway";
import { customerCheckoutSchema, parseSchema } from "@/lib/validationSchemas";
import { sendOrderWhatsApp } from "@/lib/whatsappService";
import { ObjectId } from "mongodb";

async function getPublicRestaurantId(db) {
  const envRestaurantId = process.env.NEXT_PUBLIC_RESTAURANT_ID?.trim();
  if (envRestaurantId) {
    try {
      return new ObjectId(envRestaurantId);
    } catch {
      // ignore malformed env and fallback to active restaurant
    }
  }
  const restaurant = await db.collection("restaurants").findOne(
    { status: "active" },
    { sort: { createdAt: 1 }, projection: { _id: 1 } }
  );
  return restaurant?._id ?? null;
}

export async function GET(request) {
  const token = getCustomerTokenFromRequest(request);
  const payload = verifyCustomerToken(token);
  if (!payload?.id && !payload?.phone && !payload?.email) {
    return Response.json({ success: false, error: "Not authenticated." }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const match = [];
    if (payload.phone) {
      match.push({ "customerInfo.phone": payload.phone });
    }
    if (payload.email) {
      const em = String(payload.email).trim().toLowerCase();
      if (em) {
        match.push({ "customerInfo.email": em });
      }
    }
    if (payload.id) {
      try {
        match.push({ customerAccountId: new ObjectId(payload.id) });
      } catch {
        /* ignore */
      }
    }
    if (match.length === 0) {
      return Response.json({ success: false, error: "Not authenticated." }, { status: 401 });
    }

    const orders = await db
      .collection("orders")
      .find({ $or: match })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return Response.json({
      success: true,
      orders: orders.map((o) => {
        const meta = normalizeCustomerOrderStatus(o.status);
        return {
          id: String(o._id),
          orderId: o.orderId ?? "",
          orderType: o.orderType ?? "",
          total: Number(o.total ?? 0),
          status: o.status ?? "",
          statusKey: meta.key,
          statusLabel: meta.label,
          statusEmoji: meta.emoji,
          chipClass: meta.chipClass,
          createdAt: o.createdAt ?? null,
        };
      }),
    });
  } catch (err) {
    console.error("customer.orders.GET failed:", err.message);
    return Response.json({ success: false, error: "Failed to load orders." }, { status: 500 });
  }
}

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      id: String(item.id ?? ""),
      name: String(item.name ?? "").trim(),
      price: Number(item.price ?? 0),
      qty: Number(item.qty ?? 0),
    }))
    .filter((item) => item.name && Number.isFinite(item.price) && item.price >= 0 && Number.isFinite(item.qty) && item.qty > 0);
}

export async function POST(request) {
  const customerPayload = verifyCustomerToken(getCustomerTokenFromRequest(request));
  if (!customerPayload?.id && !customerPayload?.phone && !customerPayload?.email) {
    return Response.json(
      { success: false, error: "Please login to place an order." },
      { status: 401 }
    );
  }
  let customerAccountId = null;
  if (customerPayload?.id) {
    try { customerAccountId = new ObjectId(customerPayload.id); } catch {}
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  let parsed;
  try {
    parsed = parseSchema(customerCheckoutSchema, body);
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 400 });
  }

  const items = normalizeItems(parsed.items);
  const orderType = parsed.orderType;
  const paymentMethod = String(parsed.paymentMethod || "cod");
  const customerName = String(parsed.customer?.name ?? "").trim();
  const phone = String(parsed.customer?.phone ?? "").trim();
  const email = String(parsed.customer?.email ?? "").trim();
  const address = String(parsed.customer?.address ?? "").trim();
  const tableNumber = String(parsed.customer?.tableNumber ?? body.tableNumber ?? "").trim();
  const notes = String(parsed.notes ?? "").trim();

  if (orderType === "delivery" && !address) {
    return Response.json({ success: false, error: "Delivery address is required." }, { status: 400 });
  }
  if (orderType === "dine-in" && !tableNumber) {
    return Response.json({ success: false, error: "Table number is required for dine-in." }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    const restaurantId = await getPublicRestaurantId(db);
    if (!restaurantId) {
      return Response.json({ success: false, error: "No active restaurant available for ordering." }, { status: 404 });
    }

    const settingsDoc = await db.collection("restaurant_settings").findOne(
      { restaurantId },
      { projection: { pos: 1, paymentMethods: 1, general: 1 } }
    );
    const taxPercentage = Number(settingsDoc?.pos?.taxPercentage ?? 8);
    const serviceCharge = Number(settingsDoc?.pos?.serviceCharge ?? 0);
    const safeTaxPercent = Number.isFinite(taxPercentage) ? Math.max(0, taxPercentage) : 8;
    const safeServiceCharge = Number.isFinite(serviceCharge) ? Math.max(0, serviceCharge) : 0;
    const paymentMethods = {
      defaultMethod: "cod",
      cod: true,
      cashCounter: true,
      upi: true,
      card: true,
      netBanking: true,
      wallet: true,
      payLater: false,
      bankTransfer: false,
      ...(settingsDoc?.paymentMethods ?? {}),
    };
    const enabledMethods = Object.keys(paymentMethods).filter(
      (k) => k !== "defaultMethod" && Boolean(paymentMethods[k])
    );
    if (!enabledMethods.includes(paymentMethod)) {
      return Response.json(
        { success: false, error: "Selected payment method is disabled for this restaurant." },
        { status: 400 }
      );
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const tax = Number((subtotal * (safeTaxPercent / 100)).toFixed(2));
    const deliveryCharge = orderType === "delivery" ? Number(safeServiceCharge.toFixed(2)) : 0;
    const total = Number((subtotal + tax + deliveryCharge).toFixed(2));
    const now = new Date();
    const currency = String(settingsDoc?.general?.currency || "USD").toUpperCase();
    const orderId = `ORD-C-${Date.now()}`;
    let gatewaySession = null;
    if (["upi", "card", "netBanking", "wallet", "payLater", "bankTransfer"].includes(paymentMethod)) {
      try {
        gatewaySession = await createGatewayPaymentSession({
          db,
          amount: total,
          currency,
          orderId,
          method: paymentMethod,
        });
      } catch (err) {
        return Response.json(
          { success: false, error: err.message || "Payment gateway setup issue." },
          { status: 400 }
        );
      }
    }

    const doc = {
      restaurantId,
      orderId,
      source: "customer",
      customerAccountId,
      orderType,
      tableNumber: orderType === "dine-in" ? tableNumber : null,
      customer: customerName,
      customerInfo: {
        name: customerName,
        phone,
        email: email || null,
        address: orderType === "delivery" ? address : null,
      },
      items,
      itemCount: items.reduce((sum, item) => sum + item.qty, 0),
      subtotal,
      tax,
      taxPercentage: safeTaxPercent,
      deliveryCharge,
      total,
      status: "new",
      payment: {
        method: paymentMethod,
        status: paymentMethod === "cod" || paymentMethod === "cashCounter" ? "pending" : "initiated",
        provider: ["upi", "card", "netBanking", "wallet", "payLater"].includes(paymentMethod)
          ? "gateway"
          : "offline",
        currency,
        gatewayProvider: gatewaySession?.provider ?? null,
        gatewayOrderId: gatewaySession?.providerOrderId ?? null,
      },
      notes,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("orders").insertOne(doc);
    if (orderType === "dine-in" && tableNumber) {
      await db.collection("tables").updateOne(
        { restaurantId, tableNumber },
        { $set: { status: "occupied", updatedAt: new Date() } }
      ).catch(() => {});
    }
    logInfo("customer.order.created", { route: "/api/customer/orders", orderId: doc.orderId });

    // ── WhatsApp: Order Confirmed ──
    const restaurantName = settingsDoc?.general?.restaurantName ?? "Restaurant";
    sendOrderWhatsApp({
      event: "order_confirmed",
      order: doc,
      db,
      restaurantId,
      restaurantName,
    }).catch(() => {}); // fire-and-forget, never block the response

    return Response.json({
      success: true,
      order: {
        id: result.insertedId.toString(),
        orderId: doc.orderId,
        total: doc.total,
        status: doc.status,
        payment: {
          ...doc.payment,
          checkout: gatewaySession?.checkout ?? null,
        },
      },
    }, { status: 201 });
  } catch (err) {
    logError("customer.order.create_failed", err, { route: "/api/customer/orders" });
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
