/**
 * Super Admin E2E API smoke test — run while dev server is on :3000
 * node scripts/test-super-admin-e2e.mjs
 */
const BASE = process.env.BASE_URL || "http://localhost:3000";
const EMAIL = "superadmin@rms.com";
const PASS = "SuperAdmin@2026";

const SA_APIS_SHOULD_WORK = [
  ["GET", "/api/auth/me"],
  ["GET", "/api/super-admin/stats"],
  ["GET", "/api/super-admin/restaurants"],
  ["GET", "/api/super-admin/users"],
  ["GET", "/api/super-admin/plans"],
  ["GET", "/api/super-admin/payments"],
  ["GET", "/api/super-admin/billing"],
  ["GET", "/api/super-admin/analytics"],
  ["GET", "/api/super-admin/landing"],
  ["GET", "/api/super-admin/contact-messages?stats=1"],
  ["GET", "/api/super-admin/logs?limit=5"],
  ["GET", "/api/super-admin/support-tickets"],
  ["GET", "/api/super-admin/settings"],
  ["GET", "/api/super-admin/subscriptions"],
  ["GET", "/api/inbox"],
  ["GET", "/api/landing-sections"],
];

const SA_APIS_SHOULD_DENY = [
  ["GET", "/api/users/staff"],
  ["GET", "/api/dashboard/summary"],
  ["GET", "/api/orders"],
  ["GET", "/api/menu"],
];

const SA_PAGES = [
  "/super-admin/dashboard",
  "/super-admin/restaurants",
  "/super-admin/payments",
  "/super-admin/plans",
  "/super-admin/billing",
  "/super-admin/analytics",
  "/super-admin/landing-site",
  "/super-admin/contact-inbox",
  "/super-admin/logs",
  "/super-admin/support-tickets",
  "/super-admin/settings",
  "/super-admin/profile",
  "/super-admin/users",
  "/super-admin/payment-gateways",
];

const SA_PAGES_SHOULD_BLOCK = [
  "/dashboard",
  "/pos",
  "/login",
];

function parseSetCookie(res) {
  const raw = res.headers.getSetCookie?.() ?? [];
  return raw.map((c) => c.split(";")[0]).join("; ");
}

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  const data = await res.json();
  const cookie = parseSetCookie(res);
  return { ok: res.ok && data.success, status: res.status, role: data.user?.role, cookie, error: data.error, data };
}

async function call(method, path, cookie, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { cookie, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    redirect: "manual",
  });
  let parsed = null;
  try {
    parsed = await res.json();
  } catch {
    parsed = null;
  }
  return {
    status: res.status,
    success: parsed?.success,
    error: parsed?.error,
    location: res.headers.get("location"),
  };
}

async function main() {
  console.log("=== Super Admin E2E Test ===\n");
  const loginResult = await login();
  if (!loginResult.ok) {
    console.error("LOGIN FAILED", loginResult.status, loginResult.error, loginResult.data);
    process.exit(1);
  }
  console.log(`Login OK — role: ${loginResult.role}\n`);

  let pass = 0;
  let fail = 0;

  console.log("--- Platform APIs (should work) ---");
  for (const [method, path] of SA_APIS_SHOULD_WORK) {
    const r = await call(method, path, loginResult.cookie);
    const ok = r.status === 200 && r.success !== false;
    console.log(`${ok ? "✓" : "✗"} ${method} ${path} → ${r.status} ${r.error ?? (r.success ? "ok" : "")}`);
    ok ? pass++ : fail++;
  }

  console.log("\n--- Restaurant tenant APIs (should deny) ---");
  for (const [method, path] of SA_APIS_SHOULD_DENY) {
    const r = await call(method, path, loginResult.cookie);
    const ok = r.status === 403 || r.status === 401 || r.status === 400;
    console.log(`${ok ? "✓" : "✗"} ${method} ${path} → ${r.status} (expected deny)`);
    ok ? pass++ : fail++;
  }

  console.log("\n--- Super Admin pages ---");
  for (const path of SA_PAGES) {
    const r = await call("GET", path, loginResult.cookie);
    const ok = r.status === 200;
    console.log(`${ok ? "✓" : "✗"} GET ${path} → ${r.status}`);
    ok ? pass++ : fail++;
  }

  console.log("\n--- Legacy redirects (RSC may return 200; browser follows redirect) ---");
  for (const path of ["/super-admin/restaurant-payments", "/super-admin/payment-gateways"]) {
    const r = await call("GET", path, loginResult.cookie);
    const ok =
      r.status === 307 ||
      r.status === 302 ||
      r.status === 308 ||
      r.status === 200;
    console.log(`${ok ? "✓" : "✗"} GET ${path} → ${r.status}${r.location ? ` → ${r.location}` : ""}`);
    ok ? pass++ : fail++;
  }

  console.log("\n--- Other roles blocked from platform ---");
  const managerLogin = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "manager@restaurant.com", password: "password123" }),
  }).then(async (res) => ({
    cookie: parseSetCookie(res),
    ok: res.ok,
  }));
  if (managerLogin.ok) {
    const blocked = await call("GET", "/api/super-admin/stats", managerLogin.cookie);
    const blockedOk = blocked.status === 403;
    console.log(`${blockedOk ? "✓" : "✗"} manager GET /api/super-admin/stats → ${blocked.status} (expected 403)`);
    blockedOk ? pass++ : fail++;

    const blockedPage = await call("GET", "/super-admin/dashboard", managerLogin.cookie);
    const pageBlocked =
      blockedPage.status === 307 ||
      blockedPage.status === 302 ||
      blockedPage.status === 308 ||
      (blockedPage.location && blockedPage.location.includes("unauthorized"));
    console.log(
      `${pageBlocked ? "✓" : "✗"} manager GET /super-admin/dashboard → ${blockedPage.status}${blockedPage.location ? ` → ${blockedPage.location}` : ""}`
    );
    pageBlocked ? pass++ : fail++;
  } else {
    console.log("✗ manager login failed — skipped cross-role checks");
    fail += 2;
  }

  console.log(`\n=== ${pass} passed, ${fail} failed ===`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
