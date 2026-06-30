import { listActiveCouponsForChannel, seedCouponsIfEmpty } from "@/lib/couponDb";
import { buildAutoPaymentMethods, loadRestaurantCheckoutMeta } from "@/lib/checkoutPaymentMeta";
import clientPromise from "@/lib/mongodb";
import { getRestaurantIdFromRequest } from "@/lib/restaurantResolver";

export async function GET(request) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const restaurantId = await getRestaurantIdFromRequest(db, request);

    if (!restaurantId) {
      return Response.json({
        success: true,
        meta: {
          taxPercentage: 8,
          deliveryCharge: 0,
          paymentMethods: buildAutoPaymentMethods(false),
          onlinePaymentsAvailable: false,
          etaMinutes: { "dine-in": "15-20", takeaway: "20-30", delivery: "30-45" },
          coupons: [],
          minOrderAmount: 0,
        },
      });
    }

    const {
      settingsDoc,
      onlineOk,
      taxPercentage,
      serviceCharge,
      paymentMethods,
    } = await loadRestaurantCheckoutMeta(db, restaurantId);

    await seedCouponsIfEmpty(db, restaurantId);
    const coupons = await listActiveCouponsForChannel(db, restaurantId, "online");

    return Response.json({
      success: true,
      meta: {
        taxPercentage,
        deliveryCharge: serviceCharge,
        paymentMethods,
        onlinePaymentsAvailable: onlineOk,
        coupons,
        minOrderAmount: Number(settingsDoc?.pos?.minOrderAmount ?? 0),
        etaMinutes: settingsDoc?.pos?.etaMinutes ?? { "dine-in": "15-20", takeaway: "20-30", delivery: "30-45" },
      },
    });
  } catch {
    return Response.json(
      { success: false, error: "Failed to load checkout metadata." },
      { status: 500 }
    );
  }
}
