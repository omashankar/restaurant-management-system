import { appBaseUrl } from "@/lib/gateways/constants";

function buildRedirect(form) {
  const udf1 = String(form.get("udf1") ?? form.get("txnid") ?? "").trim();
  const returnKind = String(form.get("udf2") ?? "order").trim();
  const base = appBaseUrl();
  const params = new URLSearchParams({ provider: "payu" });
  for (const [key, value] of form.entries()) {
    if (value != null && value !== "") params.set(key, String(value));
  }
  if (returnKind === "subscription") {
    params.set("paymentId", udf1);
    return `${base}/billing/payment-return?${params.toString()}`;
  }
  params.set("orderId", udf1);
  return `${base}/order/payment-return?${params.toString()}`;
}

export async function POST(request) {
  try {
    const form = await request.formData();
    return Response.redirect(buildRedirect(form), 303);
  } catch (err) {
    console.error("PayU callback:", err.message);
    return Response.redirect(`${appBaseUrl()}/order/checkout`, 303);
  }
}

export async function GET(request) {
  const url = new URL(request.url);
  return Response.redirect(buildRedirect(url.searchParams), 303);
}
