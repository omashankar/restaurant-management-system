/**
 * Admin role E2E API smoke test — run while dev server is on :3000
 * node scripts/test-admin-e2e.mjs
 */
const BASE = process.env.BASE_URL || "http://localhost:3000";
const EMAIL = "admin@restaurant.com";
const PASS = "password123";

const ADMIN_SHOULD_WORK = [
  ["GET", "/api/auth/me"],
  ["GET", "/api/dashboard/summary"],
  ["GET", "/api/orders?limit=5"],
  ["GET", "/api/menu"],
  ["GET", "/api/categories"],
  ["GET", "/api/tables"],
  ["GET", "/api/tables/areas"],
  ["GET", "/api/inventory"],
  ["GET", "/api/customers"],
  ["GET", "/api/reservations"],
  ["GET", "/api/analytics"],
  ["GET", "/api/inbox"],
  ["GET", "/api/support/tickets"],
  ["GET", "/api/recipes"],
  ["GET", "/api/settings"],
  ["GET", "/api/users/staff"],
  ["GET", "/api/payment-settings"],
  ["GET", "/api/printer-settings"],
  ["GET", "/api/whatsapp-settings"],
  ["GET", "/api/billing/overview"],
  ["GET", "/api/restaurant-cms"],
  ["GET", "/api/subscription"],
  ["GET", "/api/payout-requests"],
  ["GET", "/api/payment-transactions"],
  ["GET", "/api/refund-requests"],
  ["GET", "/api/tenant-contact-messages"],
  ["GET", "/api/newsletter-subscribers"],
];

const ADMIN_SHOULD_DENY = [
  ["GET", "/api/super-admin/stats"],
  ["GET", "/api/super-admin/settings"],
];

const ADMIN_PAGES = [
  "/dashboard",
  "/pos",
  "/orders",
  "/kitchen",
  "/tables",
  "/tables/areas",
  "/reservations",
  "/menu/items",
  "/menu/categories",
  "/menu/recipes",
  "/customers",
  "/staff",
  "/inventory",
  "/analytics",
  "/billing",
  "/qr-menu",
  "/customer-site",
  "/whatsapp",
  "/printer-settings",
  "/settings",
  "/support-tickets",
  "/profile",
  "/admin/dashboard",
];

function parseSetCookie(res) {
  const raw = res.headers.getSetCookie?.() ?? [];
  return raw.map((c) => c.split(";")[0]).join("; ");
}

async function login(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  const cookie = parseSetCookie(res);
  return { ok: res.ok && data.success, status: res.status, role: data.user?.role, cookie, error: data.error };
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
    body: parsed,
  };
}

async function main() {
  console.log("=== Admin E2E API Test ===\n");
  const loginResult = await login(EMAIL, PASS);
  if (!loginResult.ok) {
    console.error("LOGIN FAILED", loginResult.status, loginResult.error);
    process.exit(1);
  }
  console.log(`Login OK — role: ${loginResult.role}\n`);

  let pass = 0;
  let fail = 0;

  console.log("--- Tenant APIs (should work) ---");
  for (const [method, path] of ADMIN_SHOULD_WORK) {
    const r = await call(method, path, loginResult.cookie);
    const ok = r.status === 200 && r.success !== false;
    console.log(`${ok ? "✓" : "✗"} ${method} ${path} → ${r.status} ${r.error ?? (r.success ? "ok" : "")}`);
    ok ? pass++ : fail++;
  }

  console.log("\n--- Platform APIs (should deny) ---");
  for (const [method, path] of ADMIN_SHOULD_DENY) {
    const r = await call(method, path, loginResult.cookie);
    const ok = r.status === 403 || r.status === 401;
    console.log(`${ok ? "✓" : "✗"} ${method} ${path} → ${r.status} (expected deny)`);
    ok ? pass++ : fail++;
  }

  console.log("\n--- Admin-only writes (not 403) ---");
  const writeChecks = [
    ["PATCH", "/api/settings", {}],
    ["PATCH", "/api/payment-settings", { section: "tax", data: {} }],
    ["POST", "/api/users/create", {}],
    ["PATCH", "/api/printer-settings", { printers: [] }],
  ];
  for (const [method, path, body] of writeChecks) {
    const r = await call(method, path, loginResult.cookie, body);
    const ok = r.status !== 403 && r.status !== 401;
    console.log(`${ok ? "✓" : "✗"} ${method} ${path} → ${r.status} (admin allowed, may be 400)`);
    ok ? pass++ : fail++;
  }

  console.log("\n--- Admin pages ---");
  for (const path of ADMIN_PAGES) {
    const r = await call("GET", path, loginResult.cookie);
    const ok = r.status === 200 || (r.status === 307 && r.location?.includes("/dashboard"));
    console.log(`${ok ? "✓" : "✗"} GET ${path} → ${r.status}${r.location ? ` → ${r.location}` : ""}`);
    ok ? pass++ : fail++;
  }

  console.log("\n--- Blocked from super-admin panel ---");
  const blockedPage = await call("GET", "/super-admin/dashboard", loginResult.cookie);
  const pageBlocked =
    blockedPage.status === 307 ||
    blockedPage.status === 302 ||
    (blockedPage.location && blockedPage.location.includes("unauthorized"));
  console.log(
    `${pageBlocked ? "✓" : "✗"} GET /super-admin/dashboard → ${blockedPage.status}${blockedPage.location ? ` → ${blockedPage.location}` : ""}`
  );
  pageBlocked ? pass++ : fail++;

  console.log("\n--- Dashboard chart data ---");
  const sumRes = await call("GET", "/api/dashboard/summary", loginResult.cookie);
  if (sumRes.status === 200 && sumRes.body) {
    const weekLen = sumRes.body.dailyRevenueWeek?.length ?? 0;
    const todayRev = sumRes.body.today?.revenue ?? 0;
    console.log(`dailyRevenueWeek points = ${weekLen}, today revenue = ${todayRev}`);
    if (weekLen === 0 && todayRev > 0) {
      console.log("✗ Week chart empty while today has revenue");
      fail++;
    } else {
      console.log("✓ Chart data consistent");
      pass++;
    }
  } else {
    console.log("✗ Could not load dashboard summary for chart check");
    fail++;
  }

  console.log(`\n=== ${pass} passed, ${fail} failed ===`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
