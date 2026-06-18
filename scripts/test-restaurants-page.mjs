/**
 * Restaurants page + API integration tests (super admin).
 * Run: node scripts/test-restaurants-page.mjs
 */
const BASE = process.env.BASE_URL || "http://localhost:3000";

let passed = 0;
let failed = 0;

function ok(label) {
  passed++;
  console.log(`✓ ${label}`);
}
function fail(label, detail = "") {
  failed++;
  console.log(`✗ ${label}${detail ? ` — ${detail}` : ""}`);
}

async function login(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(`Login failed: ${email}`);
  return res.headers.get("set-cookie")?.split(";")[0] ?? "";
}

async function api(cookie, path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json",
      ...(opts.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function main() {
  console.log("=== Restaurants Page Tests ===\n");

  const saCookie = await login("superadmin@rms.com", "SuperAdmin@2026");
  ok("Super admin login");

  const { data: list } = await api(saCookie, "/api/super-admin/restaurants?page=1&pageSize=10");
  if (!list.success || !list.restaurants?.length) {
    fail("List restaurants", list.error ?? "empty");
    process.exit(1);
  }
  ok(`List restaurants (${list.restaurants.length} rows, total ${list.total})`);

  const statsSum = list.stats.active + list.stats.inactive + list.stats.suspended;
  if (statsSum === list.stats.total) ok("Global stats sum matches total");
  else fail("Global stats sum", `${statsSum} vs total ${list.stats.total}`);

  const { data: filtered } = await api(
    saCookie,
    "/api/super-admin/restaurants?page=1&pageSize=10&status=active",
  );
  if (filtered.stats?.total === list.stats?.total) ok("Stats stay global when status filter applied");
  else fail("Stats with filter", `global ${filtered.stats?.total} vs ${list.stats?.total}`);

  const target = list.restaurants[0];
  const ownerEmail = target.ownerEmail;

  // Find a restaurant admin password - try common demo
  let ownerCookie = null;
  for (const pwd of ["password123", "Admin@2026", "Restaurant@2026"]) {
    try {
      ownerCookie = await login(ownerEmail, pwd);
      break;
    } catch {
      /* try next */
    }
  }

  for (const status of ["inactive", "suspended", "active"]) {
    const { res, data } = await api(saCookie, `/api/super-admin/restaurants/${target.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    if (res.ok && data.success && data.status === status) ok(`PATCH status → ${status}`);
    else fail(`PATCH status → ${status}`, data.error);
  }

  const { data: after } = await api(
    saCookie,
    `/api/super-admin/restaurants?page=1&search=${encodeURIComponent(target.name)}`,
  );
  const row = after.restaurants?.find((r) => r.id === target.id);
  if (row?.status === "active") ok("Status restored to active");
  else fail("Status restore", row?.status);

  if (ownerCookie) {
    await api(saCookie, `/api/super-admin/restaurants/${target.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "suspended" }),
    });

    const loginRes = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ownerEmail, password: "password123" }),
    });
    const loginData = await loginRes.json();
    if (!loginData.success && loginRes.status === 403) ok("Owner login blocked when restaurant suspended");
    else fail("Owner login when suspended", JSON.stringify(loginData));

    const meRes = await fetch(`${BASE}/api/auth/me`, {
      headers: { Cookie: ownerCookie },
    });
    const meData = await meRes.json();
    if (!meData.success && (meRes.status === 403 || meRes.status === 401)) {
      ok("/api/auth/me rejects inactive session after suspend");
    } else if (meData.user?.status !== "active") {
      ok("/api/auth/me returns non-active user status");
    } else {
      fail("/api/auth/me still active after suspend", meData.user?.status);
    }

    await api(saCookie, `/api/super-admin/restaurants/${target.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "active" }),
    });
  } else {
    console.log("⊘ Skipped owner login tests (demo password not found for " + ownerEmail + ")");
  }

  if (target.slug) {
    const slugRes = await fetch(`${BASE}/r/${target.slug}/home`);
    if (slugRes.ok) ok(`Customer site /r/${target.slug}/home loads for active restaurant`);
    else fail("Customer site slug", slugRes.status);
  }

  const pageRes = await fetch(`${BASE}/super-admin/restaurants`, {
    headers: { Cookie: saCookie },
  });
  if (pageRes.ok) ok("Restaurants page HTML loads");
  else fail("Restaurants page", pageRes.status);

  console.log(`\n=== ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
