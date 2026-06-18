/**
 * Extended Super Admin audit — business logic + data consistency.
 * Run: node scripts/test-super-admin-full-audit.mjs
 */
const BASE = process.env.BASE_URL || "http://localhost:3000";
const SA_EMAIL = "superadmin@rms.com";
const SA_PASS = "SuperAdmin@2026";

let pass = 0;
let fail = 0;

function ok(msg) { pass++; console.log(`✓ ${msg}`); }
function bad(msg, detail = "") { fail++; console.log(`✗ ${msg}${detail ? ` — ${detail}` : ""}`); }

function parseCookies(res) {
  const raw = res.headers.getSetCookie?.() ?? [];
  if (raw.length) return raw.map((c) => c.split(";")[0]).join("; ");
  return res.headers.get("set-cookie")?.split(";")[0] ?? "";
}

async function saLogin() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: SA_EMAIL, password: SA_PASS }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? "SA login failed");
  return { cookie: parseCookies(res), user: data.user };
}

async function api(cookie, path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { Cookie: cookie, ...(opts.body ? { "Content-Type": "application/json" } : {}), ...opts.headers },
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function main() {
  console.log("=== Super Admin Full Audit ===\n");
  const { cookie } = await saLogin();
  ok("Super admin login");

  // ── Dashboard stats ──
  const stats = await api(cookie, "/api/super-admin/stats");
  if (stats.data.success && typeof stats.data.stats === "object") ok("Dashboard stats API");
  else bad("Dashboard stats API", stats.data.error);

  // ── Plans ──
  const plans = await api(cookie, "/api/super-admin/plans");
  const planList = plans.data.plans ?? [];
  if (plans.data.success && planList.length >= 4) ok(`Plans loaded (${planList.length})`);
  else bad("Plans API", plans.data.error);

  const hasPrices = planList.every((p) =>
    typeof p.monthlyPrice === "number" && typeof p.yearlyPrice === "number");
  if (hasPrices) ok("All plans have monthly + yearly prices");
  else bad("Plan prices missing on some plans");

  // Landing pricing sync
  const landing = await fetch(`${BASE}/api/landing-page`).then((r) => r.json());
  const lp = landing?.content?.pricing ?? landing?.pricing ?? [];
  if (planList.length && lp.length) {
    const starterSa = planList.find((p) => p.slug === "starter");
    const starterLp = lp.find((p) => (p.slug ?? p.planSlug) === "starter");
    if (starterSa && starterLp) {
      const saM = starterSa.monthlyPrice;
      const lpM = starterLp.monthlyPrice ?? starterLp.price?.monthly ?? starterLp.price;
      const saY = starterSa.yearlyPrice;
      const lpY = starterLp.yearlyPrice ?? starterLp.price?.yearly;
      if (saM === lpM && saY === lpY) ok(`Landing ↔ Plans sync (starter ${saM}/${saY})`);
      else bad("Landing pricing mismatch", `SA=${saM}/${saY} LP=${lpM}/${lpY}`);
    } else ok("Landing pricing section present");
  } else {
    ok("Landing API reachable");
  }

  // ── Billing / subscriptions ──
  const billing = await api(cookie, "/api/super-admin/billing?page=1&limit=10");
  if (billing.data.success && billing.data.overview) ok("Billing API + overview");
  else bad("Billing API", billing.data.error);

  const subs = await api(cookie, "/api/super-admin/subscriptions?page=1&limit=10");
  if (subs.data.success && subs.data.statusCounts) ok("Subscriptions API + statusCounts");
  else bad("Subscriptions API", subs.data.error);

  // ── Restaurants paginated ──
  const restaurants = await api(cookie, "/api/super-admin/restaurants?page=1&pageSize=10");
  if (restaurants.data.success && restaurants.data.stats) {
    const s = restaurants.data.stats;
    if (s.active + s.inactive + s.suspended === s.total) ok("Restaurants global stats consistent");
    else bad("Restaurants stats sum", JSON.stringify(s));
  } else bad("Restaurants paginated API");

  const filtered = await api(cookie, "/api/super-admin/restaurants?page=1&status=active");
  if (filtered.data.stats?.total === restaurants.data.stats?.total) {
    ok("Restaurant stats stay global when filtered");
  } else bad("Restaurant filtered stats wrong");

  // ── Payments ──
  const payments = await api(cookie, "/api/super-admin/payments?page=1&limit=10");
  if (payments.data.success) ok("Payments API");
  else bad("Payments API", payments.data.error);

  // ── Analytics ──
  const analytics = await api(cookie, "/api/super-admin/analytics");
  if (analytics.data.success) ok("Analytics API");
  else bad("Analytics API", analytics.data.error);

  // ── Landing CMS ──
  const landingCms = await api(cookie, "/api/super-admin/landing");
  if (landingCms.data.success) ok("Landing CMS API");
  else bad("Landing CMS API", landingCms.data.error);

  // Block pricing edit via CMS item route
  const blockPricing = await api(cookie, "/api/super-admin/landing/pricing/fake-id", {
    method: "PATCH",
    body: JSON.stringify({ title: "hack" }),
  });
  if (blockPricing.res.status === 403 || blockPricing.res.status === 400 || blockPricing.res.status === 404) {
    ok("Landing pricing protected from CMS item edit");
  } else bad("Landing pricing CMS edit", blockPricing.res.status);

  // ── Settings ──
  const settings = await api(cookie, "/api/super-admin/settings");
  if (settings.data.success && settings.data.settings) ok("Settings API");
  else bad("Settings API", settings.data.error);

  // ── Contact / logs / tickets ──
  for (const [label, path] of [
    ["Contact inbox", "/api/super-admin/contact-messages?stats=1"],
    ["Audit logs", "/api/super-admin/logs?limit=5"],
    ["Support tickets", "/api/super-admin/support-tickets"],
  ]) {
    const r = await api(cookie, path);
    if (r.data.success) ok(label);
    else bad(label, r.data.error);
  }

  // ── Users redirect page ──
  const usersPage = await fetch(`${BASE}/super-admin/users`, { headers: { Cookie: cookie } });
  if (usersPage.ok) ok("Users page loads (redirects to restaurants)");
  else bad("Users page", usersPage.status);

  // ── SA blocked from tenant ──
  const tenantDeny = await api(cookie, "/api/orders");
  if (tenantDeny.res.status === 403) ok("Super admin blocked from tenant orders API");
  else bad("Tenant isolation", tenantDeny.res.status);

  // ── Inactive restaurant blocks staff /me ──
  const mgrLogin = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "manager@restaurant.com", password: "password123" }),
  });
  const mgrData = await mgrLogin.json();
  if (mgrData.success && mgrData.user?.restaurantId) {
    const rid = mgrData.user.restaurantId;
    const mgrCookie = parseCookies(mgrLogin);
    await api(cookie, `/api/super-admin/restaurants/${rid}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "suspended" }),
    });
    const meBlocked = await fetch(`${BASE}/api/auth/me`, { headers: { Cookie: mgrCookie } });
    if (meBlocked.status === 403) ok("Suspended restaurant → staff session blocked");
    else bad("Staff session after suspend", meBlocked.status);
    await api(cookie, `/api/super-admin/restaurants/${rid}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "active" }),
    });
  } else {
    console.log("⊘ Skipped suspend session test (manager login failed)");
  }

  console.log(`\n=== ${pass} passed, ${fail} failed ===`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
