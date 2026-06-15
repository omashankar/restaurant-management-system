const AUTH_ACCOUNT_PAGES = new Set(["login", "signup", "verify-otp"]);

/** Login, signup, and OTP verify — full-screen auth (no site header/footer). */
export function isCustomerAuthPath(pathname) {
  if (!pathname) return false;

  const normalized = pathname.replace(/\/$/, "") || "/";
  const direct = normalized.match(/^\/account\/([^/]+)$/);
  if (direct && AUTH_ACCOUNT_PAGES.has(direct[1])) return true;

  const slugged = normalized.match(/^\/r\/[^/]+\/account\/([^/]+)$/);
  if (slugged && AUTH_ACCOUNT_PAGES.has(slugged[1])) return true;

  return false;
}
