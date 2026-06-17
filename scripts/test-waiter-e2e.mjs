/**
 * Waiter role E2E API smoke test — run while dev server is on :3000
 * node scripts/test-waiter-e2e.mjs
 */
const BASE = process.env.BASE_URL || "http://localhost:3000";
const EMAIL = "waiter@restaurant.com";
const PASS = "password123";

const WAITER_SHOULD_WORK = [
  ["GET", "/api/auth/me"],
  ["GET", "/api/tables"],
  ["GET", "/api/tables/areas"],
  ["GET", "/api/orders?limit=5"],
  ["GET", "/api/menu"],
  ["GET", "/api/categories"],
  ["GET", "/api/customers"],
  ["GET", "/api/reservations"],
  ["GET", "/api/inbox"],
  ["GET", "/api/support/tickets"],
  ["GET", "/api/settings"],
];

const WAITER_SHOULD_DENY = [
  ["GET", "/api/dashboard/summary"],
  ["GET", "/api/inventory"],
  ["GET", "/api/analytics"],
  ["GET", "/api/recipes"],
  ["GET", "/api/users/staff"],
  ["POST", "/api/menu"],
  ["POST", "/api/users/create"],
  ["PATCH", "/api/settings"],
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
  return { status: res.status, success: parsed?.success, error: parsed?.error, location: res.headers.get("location") };
}

async function main() {
  console.log("=== Waiter E2E API Test ===\n");
  const loginResult = await login();
  if (!loginResult.ok) {
    console.error("LOGIN FAILED", loginResult);
    process.exit(1);
  }
  console.log(`Login OK — role: ${loginResult.role}\n`);

  let pass = 0;
  let fail = 0;

  console.log("--- Should work ---");
  for (const [method, path] of WAITER_SHOULD_WORK) {
    const r = await call(method, path, loginResult.cookie);
    const ok = r.status === 200 && r.success !== false;
    console.log(`${ok ? "✓" : "✗"} ${method} ${path} → ${r.status} ${r.error ?? (r.success ? "ok" : "")}`);
    ok ? pass++ : fail++;
  }

  console.log("\n--- Should deny (403) ---");
  for (const [method, path] of WAITER_SHOULD_DENY) {
    const r = await call(method, path, loginResult.cookie, method === "POST" || method === "PATCH" ? {} : undefined);
    const ok = r.status === 403;
    console.log(`${ok ? "✓" : "✗"} ${method} ${path} → ${r.status} (expected 403)`);
    ok ? pass++ : fail++;
  }

  console.log("\n--- Page routes (proxy) ---");
  const pages = [
    ["/dashboard", true],
    ["/pos", true],
    ["/orders", true],
    ["/tables", true],
    ["/reservations", true],
    ["/customers", true],
    ["/support-tickets", true],
    ["/menu/items", false],
    ["/inventory", false],
    ["/analytics", false],
    ["/settings", false],
    ["/staff", false],
    ["/waiter/dashboard", true],
  ];
  for (const [path, shouldAllow] of pages) {
    const r = await call("GET", path, loginResult.cookie);
    const allowed = r.status === 200;
    const blocked = r.status === 307 || r.status === 302;
    const ok = shouldAllow ? allowed : blocked;
    console.log(`${ok ? "✓" : "✗"} GET ${path} → ${r.status}${r.location ? ` → ${r.location}` : ""}`);
    ok ? pass++ : fail++;
  }

  console.log(`\n=== ${pass} passed, ${fail} failed ===`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
