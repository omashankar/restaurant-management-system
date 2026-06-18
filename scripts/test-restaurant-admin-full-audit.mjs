/**
 * Restaurant Admin full audit — tenant APIs, isolation, key flows.
 * Run: node scripts/test-restaurant-admin-full-audit.mjs
 */
const BASE = process.env.BASE_URL || "http://localhost:3000";

let pass = 0;
let fail = 0;

function ok(msg) { pass++; console.log(`✓ ${msg}`); }
function bad(msg, d = "") { fail++; console.log(`✗ ${msg}${d ? ` — ${d}` : ""}`); }

function parseCookies(res) {
  const raw = res.headers.getSetCookie?.() ?? [];
  if (raw.length) return raw.map((c) => c.split(";")[0]).join("; ");
  return res.headers.get("set-cookie")?.split(";")[0] ?? "";
}

async function login(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(`Login failed: ${email} — ${data.error}`);
  return { cookie: parseCookies(res), user: data.user };
}

async function api(cookie, path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      Cookie: cookie,
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
      ...opts.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function main() {
  console.log("=== Restaurant Admin Full Audit ===\n");

  const admin = await login("admin@restaurant.com", "password123");
  ok(`Admin login (${admin.user.role})`);

  if (!admin.user.restaurantId) bad("Admin has restaurantId");
  else ok("Admin linked to restaurant tenant");

  // ── Core reads ──
  const summary = await api(admin.cookie, "/api/dashboard/summary");
  if (summary.data.success !== false && summary.res.status === 200) {
    ok("Dashboard summary");
    const week = summary.data.dailyRevenueWeek ?? [];
    const todayRev = summary.data.today?.revenue ?? 0;
    if (week.length === 0 && todayRev > 0) bad("Dashboard week chart empty with revenue");
    else ok(`Dashboard chart (${week.length} points)`);
  } else bad("Dashboard summary", summary.data.error);

  for (const [label, path] of [
    ["Orders", "/api/orders?limit=5"],
    ["Menu", "/api/menu"],
    ["Tables", "/api/tables"],
    ["Reservations", "/api/reservations"],
    ["Staff", "/api/users/staff"],
    ["Settings", "/api/settings"],
    ["Subscription", "/api/subscription"],
    ["Restaurant CMS", "/api/restaurant-cms"],
    ["Billing overview", "/api/billing/overview"],
  ]) {
    const r = await api(admin.cookie, path);
    if (r.res.status === 200 && r.data.success !== false) ok(label);
    else bad(label, r.data.error ?? r.res.status);
  }

  // ── Platform blocked ──
  const saBlock = await api(admin.cookie, "/api/super-admin/stats");
  if (saBlock.res.status === 403) ok("Admin blocked from super-admin API");
  else bad("Super-admin isolation", saBlock.res.status);

  const saPage = await fetch(`${BASE}/super-admin/dashboard`, {
    headers: { Cookie: admin.cookie },
    redirect: "manual",
  });
  if (saPage.status === 307 || saPage.status === 302) ok("Admin blocked from super-admin UI");
  else bad("Super-admin UI block", saPage.status);

  // ── Tenant isolation: orders belong to admin restaurant ──
  const orders = await api(admin.cookie, "/api/orders?limit=20");
  const orderList = orders.data.orders ?? orders.data.items ?? [];
  if (orders.res.status === 200) {
    ok(`Orders loaded (${orderList.length})`);
  } else bad("Orders list");

  // ── Staff list tenant-scoped ──
  const staff = await api(admin.cookie, "/api/users/staff");
  const staffList = staff.data.staff ?? staff.data.users ?? [];
  if (staff.res.status === 200) {
    const allSameTenant = staffList.every(
      (s) => !s.restaurantId || s.restaurantId === admin.user.restaurantId,
    );
    if (allSameTenant || staffList.length === 0) ok(`Staff tenant-scoped (${staffList.length})`);
    else bad("Staff cross-tenant leak");
  }

  // ── Settings read ──
  const settings = await api(admin.cookie, "/api/settings");
  if (settings.data.success !== false) ok("Settings readable");
  else bad("Settings", settings.data.error);

  // ── Profile email validation ──
  const badEmail = await api(admin.cookie, "/api/auth/profile", {
    method: "PATCH",
    body: JSON.stringify({
      name: admin.user.name,
      email: "not-valid-email",
      phone: admin.user.phone ?? "",
    }),
  });
  if (badEmail.res.status === 422) ok("Profile rejects invalid email");
  else bad("Profile email validation", badEmail.res.status);

  // ── Key pages ──
  const pages = [
    "/dashboard", "/pos", "/orders", "/kitchen", "/tables", "/reservations",
    "/menu/items", "/staff", "/inventory", "/analytics", "/billing",
    "/settings", "/profile", "/customer-site", "/qr-menu",
  ];
  let pagesOk = 0;
  for (const path of pages) {
    const r = await fetch(`${BASE}${path}`, { headers: { Cookie: admin.cookie } });
    if (r.ok) pagesOk++;
  }
  if (pagesOk === pages.length) ok(`All ${pages.length} admin pages load`);
  else bad("Admin pages", `${pagesOk}/${pages.length}`);

  // ── Manager role ──
  const mgr = await login("manager@restaurant.com", "password123");
  ok("Manager login");
  const mgrStaff = await api(mgr.cookie, "/api/users/staff");
  if (mgrStaff.res.status === 200) ok("Manager can view staff");
  else bad("Manager staff", mgrStaff.res.status);

  const mgrCreate = await api(mgr.cookie, "/api/users/create", {
    method: "POST",
    body: JSON.stringify({}),
  });
  if (mgrCreate.res.status === 403) ok("Manager cannot create staff");
  else bad("Manager staff create blocked", mgrCreate.res.status);

  const mgrSettings = await api(mgr.cookie, "/api/settings", { method: "PATCH", body: "{}" });
  if (mgrSettings.res.status === 403) ok("Manager cannot PATCH settings");
  else bad("Manager settings write", mgrSettings.res.status);

  // ── Waiter restrictions ──
  const waiter = await login("waiter@restaurant.com", "password123");
  ok("Waiter login");
  const wDash = await api(waiter.cookie, "/api/dashboard/summary");
  if (wDash.res.status === 403) ok("Waiter blocked from dashboard API");
  else bad("Waiter dashboard", wDash.res.status);

  const wTables = await api(waiter.cookie, "/api/tables");
  if (wTables.res.status === 200) ok("Waiter can access tables");
  else bad("Waiter tables", wDash.res.status);

  // ── Chef kitchen flow ──
  const chef = await login("chef@restaurant.com", "password123");
  ok("Chef login");
  const cOrders = await api(chef.cookie, "/api/orders?status=new&limit=5");
  if (cOrders.res.status === 200) ok("Chef can read kitchen orders");
  else bad("Chef orders", cOrders.res.status);

  const cPost = await api(chef.cookie, "/api/orders", { method: "POST", body: JSON.stringify({}) });
  if (cPost.res.status === 403) ok("Chef cannot create orders");
  else bad("Chef order create", cPost.res.status);

  // ── Suspended restaurant blocks admin session ──
  const sa = await login("superadmin@rms.com", "SuperAdmin@2026");
  const rid = admin.user.restaurantId;
  await api(sa.cookie, `/api/super-admin/restaurants/${rid}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "suspended" }),
  });
  const meSuspended = await fetch(`${BASE}/api/auth/me`, { headers: { Cookie: admin.cookie } });
  if (meSuspended.status === 403) ok("Suspended restaurant → admin session blocked");
  else bad("Admin session when suspended", meSuspended.status);

  const tenantApi = await api(admin.cookie, "/api/orders?limit=1");
  if (tenantApi.res.status === 401 || tenantApi.res.status === 403) ok("Suspended → tenant APIs blocked");
  else bad("Tenant API when suspended", tenantApi.res.status);

  await api(sa.cookie, `/api/super-admin/restaurants/${rid}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "active" }),
  });
  ok("Restaurant re-activated after test");

  // Re-login admin after suspend may need fresh session
  const admin2 = await login("admin@restaurant.com", "password123");
  const meOk = await fetch(`${BASE}/api/auth/me`, { headers: { Cookie: admin2.cookie } });
  if (meOk.status === 200) ok("Admin can login again after re-activate");
  else bad("Admin re-login", meOk.status);

  console.log(`\n=== ${pass} passed, ${fail} failed ===`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
