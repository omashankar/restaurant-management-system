/**
 * Client-side helpers to launch gateway checkout flows.
 */

function loadScript(src) {
  if (typeof window === "undefined") return Promise.resolve(false);
  return new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function submitForm(formAction, formFields) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = formAction;
  form.style.display = "none";
  Object.entries(formFields ?? {}).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = String(value ?? "");
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
}

export async function loadRazorpayScript() {
  if (typeof window !== "undefined" && window.Razorpay) return true;
  return loadScript("https://checkout.razorpay.com/v1/checkout.js");
}

export async function loadCashfreeScript() {
  if (typeof window !== "undefined" && window.Cashfree) return true;
  return loadScript("https://sdk.cashfree.com/js/v3/cashfree.js");
}

export async function loadPaytmScript(host) {
  if (typeof window !== "undefined" && window.Paytm && window.Paytm.CheckoutJS) return true;
  return loadScript(`${host}/merchantpgpui/checkoutjs/merchants/checkout.js`);
}

export function openRazorpayCheckout({ checkout, options, onSuccess, onError, onDismiss }) {
  const rz = new window.Razorpay({
    key: checkout.key,
    amount: checkout.amount,
    currency: checkout.currency,
    order_id: checkout.orderId,
    ...options,
    handler: onSuccess,
    modal: {
      ondismiss: onDismiss,
      ...(options?.modal ?? {}),
    },
  });
  rz.on("payment.failed", onError);
  rz.open();
}

export async function openCashfreeCheckout(checkout) {
  const ok = await loadCashfreeScript();
  if (!ok) throw new Error("Could not load Cashfree SDK.");
  const cashfree = window.Cashfree({ mode: checkout.mode || "production" });
  await cashfree.checkout({
    paymentSessionId: checkout.paymentSessionId,
    redirectTarget: "_self",
  });
}

export async function openPaytmCheckout(checkout) {
  const ok = await loadPaytmScript(checkout.host);
  if (!ok) throw new Error("Could not load Paytm checkout.");
  return new Promise((resolve, reject) => {
    const config = {
      root: "",
      flow: "DEFAULT",
      data: {
        orderId: checkout.orderId,
        token: checkout.txnToken,
        tokenType: "TXN_TOKEN",
        amount: checkout.amount,
      },
      handler: {
        notifyMerchant(eventName) {
          if (eventName === "APP_CLOSED") {
            reject(new Error("Payment window closed."));
          }
        },
        transactionStatus() {
          resolve(true);
        },
      },
    };
    window.Paytm.CheckoutJS.init(config)
      .then(() => window.Paytm.CheckoutJS.invoke())
      .catch(reject);
  });
}

export function startGatewayCheckout(payment, handlers = {}) {
  const provider = payment?.gatewayProvider;
  const checkout = payment?.checkout;
  if (!provider || !checkout) {
    handlers.onError?.("Missing payment session.");
    return false;
  }

  if (provider === "razorpay" && checkout.type === "razorpay") {
    handlers.onRazorpay?.(checkout);
    return true;
  }
  if (provider === "stripe" && checkout.type === "stripe") {
    handlers.onStripe?.(checkout);
    return true;
  }
  if (provider === "cashfree" && checkout.type === "cashfree") {
    openCashfreeCheckout(checkout).catch((e) => handlers.onError?.(e.message));
    return true;
  }
  if (checkout.type === "redirect" && checkout.redirectUrl) {
    window.location.href = checkout.redirectUrl;
    return true;
  }
  if (checkout.type === "form" && checkout.formAction) {
    submitForm(checkout.formAction, checkout.formFields);
    return true;
  }
  if (provider === "paytm" && checkout.type === "paytm") {
    openPaytmCheckout(checkout)
      .then(() => handlers.onPaytmComplete?.())
      .catch((e) => handlers.onError?.(e.message));
    return true;
  }
  if (provider === "offline" && checkout.type === "offline") {
    handlers.onOffline?.(checkout);
    return true;
  }

  handlers.onError?.(`${provider} checkout is not supported.`);
  return false;
}
