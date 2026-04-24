export const TOKEN_COOKIE = "rms_token";

const IS_PROD = process.env.NODE_ENV === "production";

/**
 * Set httpOnly auth cookie.
 * Returns a NEW Response — never mutates the original (which is immutable
 * in Next.js App Router).
 */
export function setTokenCookie(response, token, rememberMe = false) {
  const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7;
  const secure = IS_PROD ? "; Secure" : "";
  const cookie = `${TOKEN_COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;

  // Collect existing headers then add Set-Cookie
  const headers = new Headers(response.headers);
  headers.set("Set-Cookie", cookie);

  return new Response(response.body, {
    status:     response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Clear auth cookie — expires it immediately.
 * Returns a NEW Response.
 */
export function clearTokenCookie(response) {
  const secure = IS_PROD ? "; Secure" : "";
  const cookie = `${TOKEN_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure}`;

  const headers = new Headers(response.headers);
  headers.set("Set-Cookie", cookie);

  return new Response(response.body, {
    status:     response.status,
    statusText: response.statusText,
    headers,
  });
}

/** Read token from request cookies */
export function getTokenFromRequest(request) {
  return request.cookies.get(TOKEN_COOKIE)?.value ?? null;
}
