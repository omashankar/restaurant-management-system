import { isOnlinePaymentConfigured } from "@/lib/paymentGateway";
import clientPromise from "@/lib/mongodb";
import { getRestaurantIdFromRequest } from "@/lib/restaurantResolver";

const ONLINE_KEYS = ["upi", "card", "debitCard", "netBanking", "wallet", "qrCode", "payLater", "bankTransfer"];

function disableOnlinePaymentMethods(paymentMethods, onlineOk) {
  if (onlineOk) return paymentMethods;
  const next = { ...paymentMethods };
  for (const k of ONLINE_KEYS) {
    next[k] = false;
  }
  let def = String(next.defaultMethod ?? "cod");
  if (ONLINE_KEYS.includes(def)) {
    if (next.cod !== false) def = "cod";
    else if (next.cashCounter !== false) def = "cashCounter";
    else def = "cod";
    next.defaultMethod = def;
  }
  return next;
}

export async function GET(request) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const onlineOk = await isOnlinePaymentConfigured(db).catch(() => false);

    const restaurantId = await getRestaurantIdFromRequest(db, request);
    if (!restaurantId) {
      const basePm = {
        defaultMethod: "cod",
        cod: true,
        cashCounter: true,
        upi: true,
        card: true,
        netBanking: true,
        wallet: true,
        payLater: false,
        bankTransfer: false,
      };
      return Response.json({
        success: true,
        meta: {
          taxPercentage: 8,
          deliveryCharge: 0,
          paymentMethods: disableOnlinePaymentMethods(basePm, onlineOk),
          onlinePaymentsAvailable: onlineOk,
          etaMinutes: { "dine-in": "15-20", takeaway: "20-30", delivery: "30-45" },
          coupons: [],
        },
      });
    }

    const settingsDoc = await db.collection("restaurant_settings").findOne(
      { restaurantId },
      { projection: { pos: 1, paymentMethods: 1 } }
    );
    // Also check restaurant-specific payment settings (new system)
    const paymentSettingsDoc = await db.collection("restaurant_payment_settings").findOne(
      { restaurantId },
      { projection: { methods: 1, tax: 1 } }
    );
    const taxPercentage = Number(
      paymentSettingsDoc?.tax?.gstPercentage ??
      settingsDoc?.pos?.taxPercentage ?? 8
    );
    const serviceCharge = Number(settingsDoc?.pos?.serviceCharge ?? 0);

    // Merge: new payment settings take priority over old paymentMethods
    const baseMethods = {
      defaultMethod: "cod",
      cod: true,
      cashCounter: true,
      upi: true,
      card: true,
      debitCard: true,
      netBanking: true,
      wallet: true,
      qrCode: false,
      payLater: false,
      bankTransfer: false,
    };
    const mergedMethods = {
      ...baseMethods,
      ...(settingsDoc?.paymentMethods ?? {}),
      ...(paymentSettingsDoc?.methods ?? {}),
    };
    const paymentMethods = disableOnlinePaymentMethods(mergedMethods, onlineOk);

    return Response.json({
      success: true,
      meta: {
        taxPercentage: Number.isFinite(taxPercentage) ? Math.max(0, taxPercentage) : 8,
        deliveryCharge: Number.isFinite(serviceCharge) ? Math.max(0, serviceCharge) : 0,
        paymentMethods,
        onlinePaymentsAvailable: onlineOk,
        etaMinutes: { "dine-in": "15-20", takeaway: "20-30", delivery: "30-45" },
        coupons: [
          { code: "SAVE10", label: "Save 10% (capped)", type: "percent", value: 10, maxDiscount: 10 },
          { code: "FLAT5", label: "Flat 5 off on orders 30+", type: "flat", value: 5, minSubtotal: 30 },
        ],
      },
    });
  } catch {
    return Response.json(
      { success: false, error: "Failed to load checkout metadata." },
      { status: 500 }
    );
  }
}
