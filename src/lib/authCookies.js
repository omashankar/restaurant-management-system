export const TOKEN_COOKIE = "rms_token";

const IS_PROD = process.env.NODE_ENV === "production";

/** Set httpOnly auth cookie */
export function setTokenCookie(response, token, rememberMe = false) {
  const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7;
  const secure = IS_PROD ? "; Secure" : "";
  response.headers.set(
    "Set-Cookie",
    `${TOKEN_COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`
  );
  return response;
}

/** Clear auth cookie */
export function clearTokenCookie(response) {
  const secure = IS_PROD ? "; Secure" : "";
  response.headers.set(
    "Set-Cookie",
    `${TOKEN_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure}`
  );
  return response;
}

/** Read token from request cookies */
export function getTokenFromRequest(request) {
  return request.cookies.get(TOKEN_COOKIE)?.value ?? null;
}
