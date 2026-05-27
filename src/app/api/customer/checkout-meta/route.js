import { isOnlinePaymentConfigured } from "@/lib/paymentGateway";
import clientPromise from "@/lib/mongodb";
import { getRestaurantIdFromRequest } from "@/lib/restaurantResolver";

const ONLINE_KEYS = ["upi", "card", "debitCard", "netBanking", "wallet", "qrCode", "payLater", "bankTransfer"];

/**
 * Option C — Auto-detect payment methods from gateway config.
 * If gateway is configured → online methods available
 * If no gateway → only COD + Cash at Counter
 */
function buildAutoPaymentMethods(onlineOk, storedMethods = {}) {
  // Always available — no gateway needed
  const base = {
    cod:         storedMethods.cod         !== false,  // default ON
    cashCounter: storedMethods.cashCounter !== false,  // default ON
  };

  if (!onlineOk) {
    // No gateway configured — only cash methods
    return {
      ...base,
      upi: false, card: false, debitCard: false,
      netBanking: false, wallet: false, qrCode: false,
      payLater: false, bankTransfer: false,
      defaultMethod: "cod",
    };
  }

  // Gateway configured — enable online methods
  // Respect stored preferences if admin has set them, otherwise default ON
  return {
    ...base,
    upi:         storedMethods.upi         !== false,
    card:        storedMethods.card        !== false,
    debitCard:   storedMethods.debitCard   !== false,
    netBanking:  storedMethods.netBanking  !== false,
    wallet:      storedMethods.wallet      !== false,
    qrCode:      Boolean(storedMethods.qrCode),       // default OFF
    payLater:    Boolean(storedMethods.payLater),      // default OFF
    bankTransfer:Boolean(storedMethods.bankTransfer),  // default OFF
    defaultMethod: storedMethods.defaultMethod ?? "cod",
  };
}

export async function GET(request) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const restaurantId = await getRestaurantIdFromRequest(db, request);
    const onlineOk = await isOnlinePaymentConfigured(db, restaurantId).catch(() => false);

    if (!restaurantId) {
      return Response.json({
        success: true,
        meta: {
          taxPercentage: 8,
          deliveryCharge: 0,
          paymentMethods: buildAutoPaymentMethods(onlineOk),
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
    const paymentSettingsDoc = await db.collection("restaurant_payment_settings").findOne(
      { restaurantId },
      { projection: { methods: 1, tax: 1 } }
    );

    const taxPercentage = Number(
      paymentSettingsDoc?.tax?.gstPercentage ??
      settingsDoc?.pos?.taxPercentage ?? 8
    );
    const serviceCharge = Number(settingsDoc?.pos?.serviceCharge ?? 0);

    // Merge stored methods — new system takes priority
    const storedMethods = {
      ...(settingsDoc?.paymentMethods ?? {}),
      ...(paymentSettingsDoc?.methods ?? {}),
    };

    // Auto-detect based on gateway config
    const paymentMethods = buildAutoPaymentMethods(onlineOk, storedMethods);

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
