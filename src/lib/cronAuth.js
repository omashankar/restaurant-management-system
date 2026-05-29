/** Verify platform cron secret from Authorization header or ?secret= */
export function verifyCronSecret(request) {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) return { ok: false, error: "CRON_SECRET is not configured." };

  const auth = request.headers.get("authorization") ?? "";
  const querySecret = new URL(request.url).searchParams.get("secret");
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : querySecret?.trim();

  if (!token || token !== expected) {
    return { ok: false, error: "Unauthorized." };
  }
  return { ok: true };
}
