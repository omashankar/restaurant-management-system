import clientPromise from "@/lib/mongodb";
import { serializeCustomerOrderListItem } from "@/lib/customerOrderSerialize";
import { getCustomerTokenFromRequest, verifyCustomerToken } from "@/lib/customerAuth";
import { logError, logInfo } from "@/lib/logger";
import { createGatewayPaymentSession } from "@/lib/paymentGateway";
import { customerCheckoutSchema, parseSchema } from "@/lib/validationSchemas";
import { sendNewOrderAlertEmail } from "@/lib/emailService";
import { getRestaurantNotificationPrefs } from "@/lib/restaurantNotificationPrefs";
import { sendOrderWhatsApp, sendNewOrderAlertWhatsApp } from "@/lib/whatsappService";
import {
  listEnabledPaymentMethods,
  loadRestaurantCheckoutMeta,
} from "@/lib/checkoutPaymentMeta";
import { resolvePaymentCurrency } from "@/lib/platformCurrency";
import { validateCustomerCoupon } from "@/lib/customerCoupons";
import { redeemCustomerPoints } from "@/lib/customerRewards";
import { isValidIndianMobile, extractIndianMobileDigits, toIndianE164 } from "@/lib/phoneUtils";
import { getRestaurantIdFromRequest } from "@/lib/restaurantResolver";
import { assertPlatformFeatureForPath } from "@/lib/platformFeatureGuard";
import { ObjectId } from "mongodb";

export async function GET(request) {
  const blocked = await assertPlatformFeatureForPath("/api/customer/orders");
  if (blocked) return blocked;
  const token = getCustomerTokenFromRequest(request);
  const payload = verifyCustomerToken(token);
  if (!payload?.id && !payload?.phone && !payload?.email) {
    return Response.json({ success: false, error: "Not authenticated." }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const restaurantId = await getRestaurantIdFromRequest(db, request);
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

    const query = { $or: match };
    if (restaurantId) query.restaurantId = restaurantId;

    const orders = await db
      .collection("orders")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return Response.json({
      success: true,
      orders: orders.map((o) => serializeCustomerOrderListItem(o)),
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
  const blocked = await assertPlatformFeatureForPath("/api/customer/orders");
  if (blocked) return blocked;

  const customerPayload = verifyCustomerToken(getCustomerTokenFromRequest(request));
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

  const phoneDigits = extractIndianMobileDigits(phone);
  const phoneE164 = isValidIndianMobile(phoneDigits) ? toIndianE164(phoneDigits) : phone;
  if (!customerPayload?.id && !customerPayload?.phone && !customerPayload?.email) {
    if (!customerName || customerName.length < 2) {
      return Response.json({ success: false, error: "Please enter your name to place an order." }, { status: 400 });
    }
    if (!isValidIndianMobile(phoneDigits) && !email) {
      return Response.json(
        { success: false, error: "Please enter a valid mobile number or email." },
        { status: 400 }
      );
    }
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    const restaurantId = await getRestaurantIdFromRequest(db, request);
    if (!restaurantId) {
      return Response.json({ success: false, error: "No active restaurant available for ordering." }, { status: 404 });
    }

    const { settingsDoc, taxPercentage: safeTaxPercent, serviceCharge: safeServiceCharge, paymentMethods } =
      await loadRestaurantCheckoutMeta(db, restaurantId);
    const enabledMethods = listEnabledPaymentMethods(paymentMethods);
    if (!enabledMethods.includes(paymentMethod)) {
      return Response.json(
        { success: false, error: "Selected payment method is disabled for this restaurant." },
        { status: 400 }
      );
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const couponCode = String(body?.couponCode ?? parsed.couponCode ?? "").trim();
    let couponDiscount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      const couponCheck = validateCustomerCoupon(couponCode, subtotal);
      if (!couponCheck.valid) {
        return Response.json({ success: false, error: couponCheck.error }, { status: 400 });
      }
      couponDiscount = Number(couponCheck.discount.toFixed(2));
      appliedCoupon = couponCheck.coupon?.code ?? couponCode.toUpperCase();
    }
    const minOrderAmount = Number(settingsDoc?.pos?.minOrderAmount ?? 0);
    if (orderType === "delivery" && minOrderAmount > 0 && subtotal < minOrderAmount) {
      return Response.json(
        { success: false, error: `Minimum order amount is ₹${minOrderAmount}.` },
        { status: 400 }
      );
    }

    const taxableSubtotal = Math.max(0, subtotal - couponDiscount);
    let pointsRedeemed = 0;
    let pointsDiscount = 0;
    const requestedPoints = Math.max(0, Math.floor(Number(body?.pointsRedeemed ?? parsed.pointsRedeemed ?? 0)));
    if (requestedPoints > 0) {
      if (!customerAccountId) {
        return Response.json(
          { success: false, error: "Login to redeem reward points." },
          { status: 401 }
        );
      }
      const redeemed = await redeemCustomerPoints(db, customerAccountId, requestedPoints, taxableSubtotal);
      pointsRedeemed = redeemed.pointsRedeemed;
      pointsDiscount = redeemed.pointsDiscount;
    }

    const afterPoints = Math.max(0, taxableSubtotal - pointsDiscount);
    const tax = Number((afterPoints * (safeTaxPercent / 100)).toFixed(2));
    const deliveryCharge = orderType === "delivery" ? Number(safeServiceCharge.toFixed(2)) : 0;
    const total = Number((afterPoints + tax + deliveryCharge).toFixed(2));
    const scheduleFor = String(body?.scheduleFor ?? parsed.scheduleFor ?? "").trim() || null;
    const now = new Date();
    const currency = await resolvePaymentCurrency(
      db,
      settingsDoc?.general?.currency,
    );
    const orderId = `ORD-C-${Date.now()}`;
    let gatewaySession = null;
    if (["upi", "card", "debitCard", "netBanking", "wallet", "payLater", "bankTransfer"].includes(paymentMethod)) {
      try {
        gatewaySession = await createGatewayPaymentSession({
          db,
          restaurantId,
          amount: total,
          currency,
          orderId,
          method: paymentMethod,
          customer: {
            name: customerName,
            email: email || "",
            phone: phoneE164 || phone,
          },
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
        phone: phoneE164 || phone,
        email: email || null,
        address: orderType === "delivery" ? address : null,
      },
      items,
      itemCount: items.reduce((sum, item) => sum + item.qty, 0),
      subtotal,
      couponCode: appliedCoupon,
      couponDiscount,
      pointsRedeemed,
      pointsDiscount,
      scheduleFor,
      tax,
      taxPercentage: safeTaxPercent,
      deliveryCharge,
      total,
      status: "new",
      payment: {
        method: paymentMethod,
        status: paymentMethod === "cod" || paymentMethod === "cashCounter" ? "pending" : "initiated",
        provider: ["upi", "card", "debitCard", "netBanking", "wallet", "payLater"].includes(paymentMethod)
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

    // ── WhatsApp: Order Confirmed + restaurant alert ──
    const restaurantName = settingsDoc?.general?.restaurantName ?? "Restaurant";
    const notificationPrefs = await getRestaurantNotificationPrefs(db, restaurantId);

    sendOrderWhatsApp({
      event: "order_confirmed",
      order: doc,
      db,
      restaurantId,
      restaurantName,
    }).catch(() => {});

    if (notificationPrefs.smsNotifications) {
      sendNewOrderAlertWhatsApp({
        order: doc,
        db,
        restaurantId,
        restaurantName,
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
