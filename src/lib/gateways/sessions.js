import crypto from "node:crypto";
import { appBaseUrl } from "@/lib/gateways/constants";

function toMinorUnits(amount) {
  return Math.max(0, Math.round(Number(amount || 0) * 100));
}

function toAmountString(amount) {
  return Number(amount || 0).toFixed(2);
}

function safeTxnId(orderId) {
  return String(orderId).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
}

function buildReturnUrl(ctx, provider, extra = "") {
  const base = appBaseUrl();
  const id = encodeURIComponent(ctx.orderId);
  if (ctx.returnKind === "subscription") {
    return `${base}/billing/payment-return?provider=${provider}&paymentId=${id}${extra}`;
  }
  return `${base}/order/payment-return?provider=${provider}&orderId=${id}${extra}`;
}

function cashfreeHost(testMode) {
  return testMode ? "https://sandbox.cashfree.com" : "https://api.cashfree.com";
}

function phonePeHost(testMode) {
  return testMode
    ? "https://api-preprod.phonepe.com/apis/hermes"
    : "https://api.phonepe.com/apis/hermes";
}

function paytmHost(testMode) {
  return testMode ? "https://securegw-stage.paytm.in" : "https://securegw.paytm.in";
}

function payPalHost(testMode) {
  return testMode ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
}

function ccAvenueHost(testMode) {
  return testMode
    ? "https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction"
    : "https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction";
}

function encryptCcAvenue(plainText, workingKey) {
  const m = crypto.createHash("md5").update(workingKey).digest();
  const iv = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f]);
  const cipher = crypto.createCipheriv("aes-128-cbc", m, iv);
  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

export async function createRazorpaySession(g, { amount, currency, orderId }) {
  const minor = toMinorUnits(amount);
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${g.apiKey}:${g.secretKey}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: minor,
      currency: String(currency || "INR").toUpperCase(),
      receipt: safeTxnId(orderId).slice(0, 40),
      notes: { orderId },
    }),
  });
  if (!res.ok) throw new Error(`Razorpay order failed: ${await res.text()}`);
  const data = await res.json();
  return {
    provider: "razorpay",
    providerOrderId: data.id,
    amountMinor: minor,
    currency: String(currency || "INR").toUpperCase(),
    checkout: {
      type: "razorpay",
      orderId: data.id,
      key: g.apiKey,
      amount: minor,
      currency: String(currency || "INR").toUpperCase(),
    },
  };
}

export async function createCashfreeSession(g, ctx) {
  const { amount, currency, orderId } = ctx;
  const orderIdCf = `cf_${safeTxnId(orderId)}`.slice(0, 45);
  const res = await fetch(`${cashfreeHost(g.testMode)}/pg/orders`, {
    method: "POST",
    headers: {
      "x-client-id": g.apiKey,
      "x-client-secret": g.secretKey,
      "x-api-version": "2023-08-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      order_id: orderIdCf,
      order_amount: Number(amount),
      order_currency: String(currency || "INR").toUpperCase(),
      customer_details: { customer_id: safeTxnId(orderId).slice(0, 50) },
      order_meta: {
        return_url: buildReturnUrl(ctx, "cashfree"),
      },
    }),
  });
  if (!res.ok) throw new Error(`Cashfree order failed: ${await res.text()}`);
  const data = await res.json();
  return {
    provider: "cashfree",
    providerOrderId: data.order_id ?? data.cf_order_id ?? orderIdCf,
    checkout: {
      type: "cashfree",
      paymentSessionId: data.payment_session_id,
      orderId: data.order_id ?? orderIdCf,
      mode: g.testMode ? "sandbox" : "production",
    },
  };
}

export async function createStripeSession(g, { amount, currency, orderId, method }) {
  const minor = toMinorUnits(amount);
  const ccy = String(currency || "USD").trim().toLowerCase();
  const form = new URLSearchParams();
  form.set("amount", String(minor));
  form.set("currency", ccy);
  form.set("automatic_payment_methods[enabled]", "true");
  form.set("metadata[orderId]", String(orderId));
  form.set("metadata[method]", String(method ?? ""));
  const res = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${g.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });
  if (!res.ok) throw new Error(`Stripe payment intent failed: ${await res.text()}`);
  const data = await res.json();
  return {
    provider: "stripe",
    providerOrderId: data.id,
    checkout: {
      type: "stripe",
      clientSecret: data.client_secret,
      paymentIntentId: data.id,
      publishableKey: g.publicKey || "",
    },
  };
}

export async function createPhonePeSession(g, ctx) {
  const { amount, orderId } = ctx;
  const txnId = safeTxnId(orderId);
  const saltIndex = g.apiKey || "1";
  const payload = {
    merchantId: g.merchantId,
    merchantTransactionId: txnId,
    merchantUserId: `u_${txnId}`.slice(0, 36),
    amount: toMinorUnits(amount),
    redirectUrl: buildReturnUrl(ctx, "phonepe"),
    redirectMode: "REDIRECT",
    callbackUrl: `${base}/api/webhooks/phonepe`,
    paymentInstrument: { type: "PAY_PAGE" },
  };
  const base64 = Buffer.from(JSON.stringify(payload)).toString("base64");
  const path = "/pg/v1/pay";
  const checksum = `${crypto.createHash("sha256").update(base64 + path + g.secretKey).digest("hex")}###${saltIndex}`;
  const res = await fetch(`${phonePeHost(g.testMode)}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-VERIFY": checksum,
      "X-MERCHANT-ID": g.merchantId,
    },
    body: JSON.stringify({ request: base64 }),
  });
  const data = await res.json();
  if (!data?.success) {
    throw new Error(data?.message || data?.code || "PhonePe session failed.");
  }
  const redirectUrl = data?.data?.instrumentResponse?.redirectInfo?.url;
  if (!redirectUrl) throw new Error("PhonePe did not return a redirect URL.");
  return {
    provider: "phonepe",
    providerOrderId: txnId,
    checkout: { type: "redirect", redirectUrl, merchantTransactionId: txnId },
  };
}

export async function createPaytmSession(g, ctx) {
  const { amount, orderId } = ctx;
  const mid = g.merchantId;
  const orderIdPaytm = safeTxnId(orderId).slice(0, 30);
  const body = {
    requestType: "Payment",
    mid,
    websiteName: g.testMode ? "WEBSTAGING" : "DEFAULT",
    orderId: orderIdPaytm,
    callbackUrl: buildReturnUrl(ctx, "paytm"),
    txnAmount: { value: toAmountString(amount), currency: "INR" },
  };
  const bodyStr = JSON.stringify(body);
  const checksum = crypto
    .createHash("sha256")
    .update(bodyStr + g.secretKey)
    .digest("hex");
  const res = await fetch(
    `${paytmHost(g.testMode)}/theia/api/v1/initiateTransaction?mid=${encodeURIComponent(mid)}&orderId=${encodeURIComponent(orderIdPaytm)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, head: { signature: checksum } }),
    },
  );
  const data = await res.json();
  const result = data?.body?.resultInfo;
  if (result?.resultStatus !== "S") {
    throw new Error(result?.resultMsg || "Paytm session failed.");
  }
  const txnToken = data?.body?.txnToken;
  if (!txnToken) throw new Error("Paytm did not return txnToken.");
  return {
    provider: "paytm",
    providerOrderId: orderIdPaytm,
    checkout: {
      type: "paytm",
      mid,
      orderId: orderIdPaytm,
      txnToken,
      amount: toAmountString(amount),
      host: paytmHost(g.testMode),
      isStaging: g.testMode,
    },
  };
}

export function createPayuSession(g, ctx) {
  const { amount, orderId, customer } = ctx;
  const key = g.apiKey;
  const salt = g.secretKey;
  const txnid = safeTxnId(orderId).slice(0, 25);
  const productinfo = "Order Payment";
  const firstname = String(customer?.name ?? "Customer").slice(0, 60);
  const email = String(customer?.email ?? "customer@example.com").slice(0, 60);
  const phone = String(customer?.phone ?? "9999999999").replace(/\D/g, "").slice(-10);
  const surl = `${appBaseUrl()}/api/payments/callback/payu`;
  const furl = surl;
  const udf1 = String(orderId);
  const udf2 = String(ctx.returnKind ?? "order");
  const hash = crypto
    .createHash("sha512")
    .update(`${key}|${txnid}|${toAmountString(amount)}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|||||||||${salt}`)
    .digest("hex");
  return {
    provider: "payu",
    providerOrderId: txnid,
    checkout: {
      type: "form",
      formAction: g.testMode ? "https://test.payu.in/_payment" : "https://secure.payu.in/_payment",
      formFields: {
        key,
        txnid,
        amount: toAmountString(amount),
        productinfo,
        firstname,
        email,
        phone,
        surl,
        furl,
        udf1,
        udf2,
        hash,
        service_provider: "payu_paisa",
      },
    },
  };
}

async function getPayPalAccessToken(g) {
  const clientId = g.clientId || g.apiKey;
  const auth = Buffer.from(`${clientId}:${g.secretKey}`).toString("base64");
  const res = await fetch(`${payPalHost(g.testMode)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error_description || "PayPal auth failed.");
  return data.access_token;
}

export async function createPayPalSession(g, ctx) {
  const { amount, currency, orderId } = ctx;
  const token = await getPayPalAccessToken(g);
  const res = await fetch(`${payPalHost(g.testMode)}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: safeTxnId(orderId),
          amount: {
            currency_code: String(currency || "USD").toUpperCase(),
            value: toAmountString(amount),
          },
        },
      ],
      application_context: {
        return_url: buildReturnUrl(ctx, "paypal"),
        cancel_url: ctx.returnKind === "subscription" ? `${appBaseUrl()}/billing` : `${appBaseUrl()}/order/checkout`,
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "PayPal order failed.");
  const approval = (data.links ?? []).find((l) => l.rel === "approve");
  if (!approval?.href) throw new Error("PayPal approval URL missing.");
  return {
    provider: "paypal",
    providerOrderId: data.id,
    checkout: { type: "redirect", redirectUrl: approval.href, paypalOrderId: data.id },
  };
}

export function createCcAvenueSession(g, ctx) {
  const { amount, currency, orderId } = ctx;
  const merchantId = g.merchantId;
  const accessCode = g.apiKey;
  const workingKey = g.secretKey;
  const orderParams = new URLSearchParams({
    merchant_id: merchantId,
    order_id: safeTxnId(orderId).slice(0, 30),
    currency: String(currency || "INR").toUpperCase(),
    amount: toAmountString(amount),
    redirect_url: `${appBaseUrl()}/api/payments/callback/ccavenue?orderId=${encodeURIComponent(orderId)}&returnKind=${ctx.returnKind === "subscription" ? "subscription" : "order"}`,
    cancel_url: ctx.returnKind === "subscription" ? `${appBaseUrl()}/billing` : `${appBaseUrl()}/order/checkout`,
    language: "EN",
  });
  const encRequest = encryptCcAvenue(orderParams.toString(), workingKey);
  return {
    provider: "ccavenue",
    providerOrderId: safeTxnId(orderId),
    checkout: {
      type: "form",
      formAction: ccAvenueHost(g.testMode),
      formFields: { encRequest, access_code: accessCode },
    },
  };
}

export function createOfflineSession(g, { orderId }) {
  return {
    provider: "offline",
    providerOrderId: orderId,
    checkout: {
      type: "offline",
      instructions: g.instructions,
      upiId: g.upiId,
      bankDetails: g.bankDetails,
    },
  };
}

export async function createSessionForGateway(gatewayId, g, ctx) {
  switch (gatewayId) {
    case "razorpay":
      return createRazorpaySession(g, ctx);
    case "cashfree":
      return createCashfreeSession(g, ctx);
    case "stripe":
      return createStripeSession(g, ctx);
    case "phonepe":
      return createPhonePeSession(g, ctx);
    case "paytm":
      return createPaytmSession(g, ctx);
    case "payu":
      return createPayuSession(g, ctx);
    case "paypal":
      return createPayPalSession(g, ctx);
    case "ccavenue":
      return createCcAvenueSession(g, ctx);
    case "offline":
      return createOfflineSession(g, ctx);
    default:
      return null;
  }
}
