import { withTenant } from "@/lib/tenantDb";
import { encryptSecret, decryptSecret, isSecretMask, maskSecret } from "@/lib/cryptoUtils";
import { EMPTY_PAYMENT_SETTINGS, ALL_GATEWAYS } from "@/config/paymentConfig";

const GATEWAY_KEYS = ["apiKey", "secretKey", "merchantId", "webhookSecret"];

function maskGateway(gw) {
  const out = { ...gw };
  for (const k of GATEWAY_KEYS) {
    if (out[k]) out[k] = maskSecret(decryptSecret(out[k]));
  }
  return out;
}

function maskBank(bank) {
  if (!bank?.accountNumber) return bank;
  const acc = String(bank.accountNumber);
  return {
    ...bank,
    accountNumber: acc.length > 4 ? "X".repeat(acc.length - 4) + acc.slice(-4) : "XXXX",
    panNumber: undefined, // never send PAN to client
  };
}

/* ── GET ── */
export const GET = withTenant(
  ["admin", "manager"],
  async ({ db, restaurantId, payload }) => {
    const doc = await db.collection("restaurant_payment_settings").findOne({ restaurantId });

    const settings = {
      methods:    { ...EMPTY_PAYMENT_SETTINGS.methods,    ...(doc?.methods    ?? {}) },
      gateways:   {},
      bank:       maskBank({ ...EMPTY_PAYMENT_SETTINGS.bank,       ...(doc?.bank       ?? {}) }),
      settlement: { ...EMPTY_PAYMENT_SETTINGS.settlement, ...(doc?.settlement ?? {}) },
      tax:        { ...EMPTY_PAYMENT_SETTINGS.tax,        ...(doc?.tax        ?? {}) },
    };

    // Mask gateway secrets
    for (const gw of Object.keys(EMPTY_PAYMENT_SETTINGS.gateways)) {
      const stored = doc?.gateways?.[gw] ?? {};
      settings.gateways[gw] = maskGateway({
        ...EMPTY_PAYMENT_SETTINGS.gateways[gw],
        ...stored,
      });
    }

    // Non-admins don't see gateway or bank details
    if (payload.role !== "admin") {
      settings.gateways = {};
      settings.bank = {};
    }

    return Response.json({ success: true, settings });
  }
);

/* ── PATCH ── */
export const PATCH = withTenant(["admin"], async ({ db, restaurantId }, request) => {
  const body = await request.json();
  const { section, data } = body;

  const allowed = Object.keys(EMPTY_PAYMENT_SETTINGS);
  if (!section || !allowed.includes(section)) {
    return Response.json({ success: false, error: "Invalid section." }, { status: 400 });
  }

  const existing = await db.collection("restaurant_payment_settings").findOne({ restaurantId });
  let updateValue;

  if (section === "gateways") {
    updateValue = { ...(existing?.gateways ?? {}) };
    for (const gw of ALL_GATEWAYS) {
      if (!data[gw]) continue;
      const existingGw = existing?.gateways?.[gw] ?? {};
      const incoming = data[gw];
      const merged = { ...EMPTY_PAYMENT_SETTINGS.gateways[gw], ...existingGw };
      merged.enabled  = Boolean(incoming.enabled ?? merged.enabled);
      merged.testMode = Boolean(incoming.testMode ?? merged.testMode);
      // Plain text fields
      for (const k of ["merchantId", "callbackUrl", "successUrl", "failedUrl", "gatewayName", "apiEndpoint", "paymentInstructions", "upiId", "bankDetails"]) {
        if (incoming[k] !== undefined) merged[k] = String(incoming[k] ?? "").trim();
      }
      if (incoming.priority !== undefined) merged.priority = Number(incoming.priority) || merged.priority;
      // Encrypted fields
      for (const k of ["apiKey", "secretKey", "webhookSecret"]) {
        const val = incoming[k];
        if (isSecretMask(val)) {
          // keep existing encrypted value
        } else {
          merged[k] = val ? encryptSecret(String(val).trim()) : "";
        }
      }
      updateValue[gw] = merged;
    }
  } else if (section === "bank") {
    const existingBank = existing?.bank ?? {};
    updateValue = { ...EMPTY_PAYMENT_SETTINGS.bank, ...existingBank };
    const fields = ["accountHolderName", "bankName", "ifscCode", "branchName", "upiId"];
    for (const f of fields) {
      if (data[f] !== undefined) updateValue[f] = String(data[f]).trim();
    }
    // Account number: only update if not masked
    if (data.accountNumber !== undefined && !String(data.accountNumber).startsWith("X")) {
      updateValue.accountNumber = String(data.accountNumber).trim();
      updateValue.verified = false; // reset verification on change
    }
    if (data.verified !== undefined) updateValue.verified = Boolean(data.verified);
  } else if (section === "tax") {
    updateValue = { ...EMPTY_PAYMENT_SETTINGS.tax, ...(existing?.tax ?? {}), ...data };
    updateValue.gstPercentage = String(Number(updateValue.gstPercentage) || 0);
  } else if (section === "methods") {
    updateValue = { ...EMPTY_PAYMENT_SETTINGS.methods, ...(existing?.methods ?? {}), ...data };
  } else if (section === "settlement") {
    updateValue = { ...EMPTY_PAYMENT_SETTINGS.settlement, ...(existing?.settlement ?? {}), ...data };
    updateValue.minWithdrawalAmount = Number(updateValue.minWithdrawalAmount) || 100;
    updateValue.autoSettle = Boolean(updateValue.autoSettle);
  } else {
    updateValue = data;
  }

  await db.collection("restaurant_payment_settings").updateOne(
    { restaurantId },
    { $set: { [section]: updateValue, updatedAt: new Date() } },
    { upsert: true }
  );

  return Response.json({ success: true });
});
