/** Cookie name */
export const TOKEN_COOKIE = "rms_token";

/** Set httpOnly auth cookie on a Response */
export function setTokenCookie(response, token, rememberMe = false) {
  const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7; // 30d or 7d
  response.headers.set(
    "Set-Cookie",
    `${TOKEN_COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax`
  );
  return response;
}

/** Clear auth cookie */
export function clearTokenCookie(response) {
  response.headers.set(
    "Set-Cookie",
    `${TOKEN_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`
  );
  return response;
}

/** Read token from request cookies */
export function getTokenFromRequest(request) {
  const cookie = request.cookies.get(TOKEN_COOKIE);
  return cookie?.value ?? null;
}
