import jwt from "jsonwebtoken";

export const CUSTOMER_TOKEN_COOKIE = "rms_customer_token";
const CUSTOMER_JWT_EXPIRES_IN = process.env.CUSTOMER_JWT_EXPIRES_IN ?? "7d";
const SECRET = process.env.JWT_SECRET ?? "dev-only-secret";

export function signCustomerToken(payload) {
  return jwt.sign(
    {
      type: "customer",
      ...payload,
    },
    SECRET,
    { expiresIn: CUSTOMER_JWT_EXPIRES_IN }
  );
}

export function verifyCustomerToken(token) {
  try {
    const payload = jwt.verify(token, SECRET);
    if (payload?.type !== "customer") return null;
    const email =
      payload.email && typeof payload.email === "string"
        ? payload.email.trim().toLowerCase()
        : payload.email;
    return { ...payload, email };
  } catch {
    return null;
  }
}

function secureSuffix() {
  return process.env.NODE_ENV === "production" ? "; Secure" : "";
}

export function setCustomerTokenCookie(response, token, rememberMe = true) {
  const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7;
  const cookie = `${CUSTOMER_TOKEN_COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax; Priority=High${secureSuffix()}`;
  const headers = new Headers(response.headers);
  headers.append("Set-Cookie", cookie);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function clearCustomerTokenCookie(response) {
  const cookie = `${CUSTOMER_TOKEN_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Priority=High${secureSuffix()}`;
  const headers = new Headers(response.headers);
  headers.append("Set-Cookie", cookie);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function getCustomerTokenFromRequest(request) {
  return request.cookies.get(CUSTOMER_TOKEN_COOKIE)?.value ?? null;
}
