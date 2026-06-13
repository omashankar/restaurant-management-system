import { appBaseUrl } from "@/lib/gateways/constants";

export async function POST(request) {
  try {
    const form = await request.formData();
    const url = new URL(request.url);
    const orderId = String(url.searchParams.get("orderId") ?? "").trim();
    const returnKind = String(url.searchParams.get("returnKind") ?? "order").trim();
    const encResp = String(form.get("encResp") ?? form.get("enc_response") ?? "").trim();
    const base = appBaseUrl();
    const params = new URLSearchParams({ provider: "ccavenue", encResp });
    if (returnKind === "subscription") {
      params.set("paymentId", orderId);
      return Response.redirect(`${base}/billing/payment-return?${params.toString()}`, 303);
    }
    params.set("orderId", orderId);
    return Response.redirect(`${base}/order/payment-return?${params.toString()}`, 303);
  } catch (err) {
    console.error("CCAvenue callback:", err.message);
    return Response.redirect(`${appBaseUrl()}/order/checkout`, 303);
  }
}
