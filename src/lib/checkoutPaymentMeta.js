import { isOnlinePaymentConfigured } from "@/lib/paymentGateway";

/**
 * Option C — Auto-detect payment methods from gateway config.
 * If gateway is configured → online methods available
 * If no gateway → only COD + Cash at Counter
 */
export function buildAutoPaymentMethods(onlineOk, storedMethods = {}) {
  const base = {
    cod: storedMethods.cod !== false,
    cashCounter: storedMethods.cashCounter !== false,
  };

  if (!onlineOk) {
    return {
      ...base,
      upi: false,
      card: false,
      debitCard: false,
      netBanking: false,
      wallet: false,
      qrCode: false,
      payLater: false,
      bankTransfer: false,
      defaultMethod: "cod",
    };
  }

  return {
    ...base,
    upi: storedMethods.upi !== false,
    card: storedMethods.card !== false,
    debitCard: storedMethods.debitCard !== false,
    netBanking: storedMethods.netBanking !== false,
    wallet: storedMethods.wallet !== false,
    qrCode: Boolean(storedMethods.qrCode),
    payLater: Boolean(storedMethods.payLater),
    bankTransfer: Boolean(storedMethods.bankTransfer),
    defaultMethod: storedMethods.defaultMethod ?? "cod",
  };
}

/** Billing → Tax GST % wins over POS tax when set. */
export function resolveCheckoutTaxPercent(settingsDoc, paymentSettingsDoc) {
  const taxPercentage = Number(
    paymentSettingsDoc?.tax?.gstPercentage ??
      settingsDoc?.pos?.taxPercentage ??
      8,
  );
  return Number.isFinite(taxPercentage) ? Math.max(0, taxPercentage) : 8;
}

export function resolveCheckoutServiceCharge(settingsDoc) {
  const serviceCharge = Number(settingsDoc?.pos?.serviceCharge ?? 0);
  return Number.isFinite(serviceCharge) ? Math.max(0, serviceCharge) : 0;
}

export function mergeStoredPaymentMethods(settingsDoc, paymentSettingsDoc) {
  return {
    ...(settingsDoc?.paymentMethods ?? {}),
    ...(paymentSettingsDoc?.methods ?? {}),
  };
}

/** @param {import("mongodb").Db} db */
export async function loadRestaurantCheckoutMeta(db, restaurantId) {
  const [settingsDoc, paymentSettingsDoc, onlineOk] = await Promise.all([
    db.collection("restaurant_settings").findOne(
      { restaurantId },
      { projection: { pos: 1, paymentMethods: 1 } },
    ),
    db.collection("restaurant_payment_settings").findOne(
      { restaurantId },
      { projection: { methods: 1, tax: 1 } },
    ),
    isOnlinePaymentConfigured(db, restaurantId).catch(() => false),
  ]);

  const storedMethods = mergeStoredPaymentMethods(settingsDoc, paymentSettingsDoc);

  return {
    settingsDoc,
    paymentSettingsDoc,
    onlineOk,
    taxPercentage: resolveCheckoutTaxPercent(settingsDoc, paymentSettingsDoc),
    serviceCharge: resolveCheckoutServiceCharge(settingsDoc),
    paymentMethods: buildAutoPaymentMethods(onlineOk, storedMethods),
    storedMethods,
  };
}

export function listEnabledPaymentMethods(paymentMethods) {
  return Object.keys(paymentMethods).filter(
    (k) => k !== "defaultMethod" && Boolean(paymentMethods[k]),
  );
}
