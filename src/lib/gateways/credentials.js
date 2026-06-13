import { decryptSecret, isSecretMask } from "@/lib/cryptoUtils";
import { GATEWAY_DEFAULT_PRIORITY } from "@/lib/gateways/constants";

export function pickGatewayField(gw, field) {
  if (!gw?.enabled) return "";
  const raw = String(gw[field] ?? "").trim();
  if (!raw || isSecretMask(raw)) return "";
  const decrypted = decryptSecret(raw);
  if (decrypted) return decrypted;
  if (field === "apiKey" && /^rzp_|^pk_|^CF_|^AZ/i.test(raw)) return raw;
  if (field === "secretKey" && raw.length >= 8 && !/^•/.test(raw)) return raw;
  if (raw.length >= 4) return raw;
  return "";
}

export function gatewayIsEnabled(cfg, id) {
  const gw = cfg.gateways?.[id];
  return Boolean(gw?.enabled);
}

export function getGatewayConfig(cfg, id) {
  const gw = cfg.gateways?.[id] ?? {};
  return {
    id,
    enabled: Boolean(gw.enabled),
    testMode: gw.testMode !== false,
    priority: Number(gw.priority ?? GATEWAY_DEFAULT_PRIORITY[id] ?? 50),
    apiKey: pickGatewayField(gw, "apiKey") || String(gw.apiKey ?? "").trim(),
    secretKey: pickGatewayField(gw, "secretKey") || String(gw.secretKey ?? "").trim(),
    publicKey: String(gw.publicKey ?? "").trim(),
    clientId: String(gw.clientId ?? gw.apiKey ?? "").trim(),
    merchantId: String(gw.merchantId ?? "").trim(),
    webhookSecret: pickGatewayField(gw, "webhookSecret") || String(gw.webhookSecret ?? "").trim(),
    instructions: String(gw.instructions ?? "").trim(),
    upiId: String(gw.upiId ?? "").trim(),
    bankDetails: String(gw.bankDetails ?? "").trim(),
  };
}

export function listEnabledGateways(cfg) {
  const ids = new Set([
    ...Object.keys(cfg.gateways ?? {}),
    "razorpay",
    "cashfree",
    "stripe",
    "phonepe",
    "paytm",
    "payu",
    "paypal",
    "ccavenue",
    "offline",
  ]);

  return [...ids]
    .map((id) => getGatewayConfig(cfg, id))
    .filter((g) => g.enabled)
    .sort((a, b) => a.priority - b.priority);
}

export function gatewayHasCredentials(id, g) {
  switch (id) {
    case "razorpay":
      return Boolean(g.apiKey && g.secretKey);
    case "stripe":
      return Boolean(g.secretKey);
    case "cashfree":
      return Boolean(g.apiKey && g.secretKey);
    case "phonepe":
      return Boolean(g.merchantId && g.secretKey);
    case "paytm":
      return Boolean(g.merchantId && g.secretKey);
    case "payu":
      return Boolean(g.apiKey && g.secretKey);
    case "paypal":
      return Boolean((g.clientId || g.apiKey) && g.secretKey);
    case "ccavenue":
      return Boolean(g.merchantId && g.apiKey && g.secretKey);
    case "offline":
      return Boolean(g.instructions || g.upiId || g.bankDetails);
    default:
      return false;
  }
}
