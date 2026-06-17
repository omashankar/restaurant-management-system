/**
 * Chef role E2E API smoke test — run while dev server is on :3000
 * node scripts/test-chef-e2e.mjs
 */
const BASE = process.env.BASE_URL || "http://localhost:3000";
const EMAIL = "chef@restaurant.com";
const PASS = "password123";

const CHEF_SHOULD_WORK = [
  ["GET", "/api/auth/me"],
  ["GET", "/api/orders?status=new&limit=10"],
  ["GET", "/api/orders?status=preparing&limit=10"],
  ["GET", "/api/orders?status=ready&limit=10"],
  ["GET", "/api/menu"],
  ["GET", "/api/categories"],
  ["GET", "/api/recipes"],
  ["GET", "/api/tables"],
  ["GET", "/api/inbox"],
  ["GET", "/api/support/tickets"],
  ["GET", "/api/settings"],
];

const CHEF_SHOULD_DENY = [
  ["GET", "/api/dashboard/summary"],
  ["GET", "/api/inventory"],
  ["GET", "/api/analytics"],
  ["GET", "/api/customers"],
  ["GET", "/api/reservations"],
  ["GET", "/api/users/staff"],
  ["POST", "/api/orders"],
  ["POST", "/api/menu"],
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
  return { ok: res.ok && data.success, role: data.user?.role, cookie, error: data.error };
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
  console.log("=== Chef E2E API Test ===\n");
  const loginResult = await login();
  if (!loginResult.ok) {
    console.error("LOGIN FAILED", loginResult);
    process.exit(1);
  }
  console.log(`Login OK — role: ${loginResult.role}\n`);

  let pass = 0;
  let fail = 0;

  console.log("--- Should work ---");
  for (const [method, path] of CHEF_SHOULD_WORK) {
    const r = await call(method, path, loginResult.cookie);
    const ok = r.status === 200 && r.success !== false;
    console.log(`${ok ? "✓" : "✗"} ${method} ${path} → ${r.status} ${r.error ?? (r.success ? "ok" : "")}`);
    ok ? pass++ : fail++;
  }

  console.log("\n--- Should deny (403) ---");
  for (const [method, path] of CHEF_SHOULD_DENY) {
    const r = await call(method, path, loginResult.cookie, method !== "GET" ? {} : undefined);
    const ok = r.status === 403;
    console.log(`${ok ? "✓" : "✗"} ${method} ${path} → ${r.status} (expected 403)`);
    ok ? pass++ : fail++;
  }

  console.log("\n--- PATCH order status (kitchen flow) ---");
  const ordersRes = await call("GET", "/api/orders?status=new&limit=1", loginResult.cookie);
  const ordersList = await fetch(`${BASE}/api/orders?status=new&limit=1`, {
    headers: { cookie: loginResult.cookie },
  }).then((r) => r.json());
  const orderId = ordersList.orders?.[0]?.id;
  if (orderId) {
    const patch = await call("PATCH", `/api/orders/${orderId}`, loginResult.cookie, { status: "preparing" });
    const ok = patch.status === 200 && patch.success !== false;
    console.log(`${ok ? "✓" : "✗"} PATCH /api/orders/${orderId} → preparing → ${patch.status}`);
    ok ? pass++ : fail++;
    if (ok) {
      await call("PATCH", `/api/orders/${orderId}`, loginResult.cookie, { status: "new" });
    }
  } else {
    console.log("○ No new orders to test PATCH (skip)");
  }

  console.log("\n--- Page routes (proxy) ---");
  const pages = [
    ["/kitchen", true],
    ["/orders", true],
    ["/support-tickets", true],
    ["/profile", true],
    ["/dashboard", false],
    ["/pos", false],
    ["/tables", false],
    ["/menu/recipes", false],
    ["/inventory", false],
    ["/analytics", false],
    ["/chef/dashboard", true],
  ];
  for (const [path, shouldAllow] of pages) {
    const r = await call("GET", path, loginResult.cookie);
    const ok = shouldAllow ? r.status === 200 : r.status === 307 || r.status === 302;
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
