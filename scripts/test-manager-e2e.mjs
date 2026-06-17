/**
 * Manager role E2E API smoke test — run while dev server is on :3000
 * node scripts/test-manager-e2e.mjs
 */
const BASE = process.env.BASE_URL || "http://localhost:3000";
const EMAIL = "manager@restaurant.com";
const PASS = "password123";

const MANAGER_SHOULD_WORK = [
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
  ["GET", "/api/auth/me"],
  ["GET", "/api/settings"],
];

const MANAGER_SHOULD_DENY = [
  ["POST", "/api/users/create"],
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

async function call(method, path, cookie) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { cookie },
    cache: "no-store",
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, success: body?.success, error: body?.error, code: body?.code };
}

async function main() {
  console.log("=== Manager E2E API Test ===\n");
  const loginResult = await login();
  if (!loginResult.ok) {
    console.error("LOGIN FAILED", loginResult);
    process.exit(1);
  }
  console.log(`Login OK — role: ${loginResult.role}\n`);

  let pass = 0;
  let fail = 0;

  console.log("--- Should work (200 + success) ---");
  for (const [method, path] of MANAGER_SHOULD_WORK) {
    const r = await call(method, path, loginResult.cookie);
    const ok = r.status === 200 && r.success !== false;
    console.log(`${ok ? "✓" : "✗"} ${method} ${path} → ${r.status} ${r.success === true ? "success" : r.error ?? r.success}`);
    ok ? pass++ : fail++;
  }

  console.log("\n--- Should deny (403) ---");
  for (const [method, path] of MANAGER_SHOULD_DENY) {
    const r = await call(method, path, loginResult.cookie);
    const ok = r.status === 403 || r.status === 401;
    console.log(`${ok ? "✓" : "✗"} ${method} ${path} → ${r.status} (expected 403)`);
    ok ? pass++ : fail++;
  }

  console.log(`\n=== ${pass} passed, ${fail} failed ===`);

  const sumRes = await call("GET", "/api/dashboard/summary", loginResult.cookie);
  if (sumRes.status === 200) {
    const weekRes = await fetch(`${BASE}/api/dashboard/summary`, { headers: { cookie: loginResult.cookie } });
    const sum = await weekRes.json();
    const weekLen = sum.dailyRevenueWeek?.length ?? 0;
    console.log(`\nChart data: dailyRevenueWeek points = ${weekLen}`);
    if (weekLen === 0 && (sum.today?.revenue ?? 0) > 0) {
      console.log("⚠ Week chart still empty while today has revenue");
      fail++;
    } else if (weekLen > 0) {
      console.log("✓ Week chart has data");
      pass++;
    }
  }

  const patchSettings = await fetch(`${BASE}/api/settings`, {
    method: "PATCH",
    headers: { cookie: loginResult.cookie, "Content-Type": "application/json" },
    body: "{}",
  });
  console.log(`PATCH /api/settings → ${patchSettings.status} (expect 403)`);
  patchSettings.status === 403 ? pass++ : fail++;

  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
