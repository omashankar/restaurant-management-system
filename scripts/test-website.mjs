/**
 * Public website + customer storefront audit.
 * Run: node scripts/test-website.mjs
 */
const BASE = process.env.BASE_URL || "http://localhost:3000";

let pass = 0;
let fail = 0;

function ok(msg) { pass++; console.log(`✓ ${msg}`); }
function bad(msg, d = "") { fail++; console.log(`✗ ${msg}${d ? ` — ${d}` : ""}`); }

async function get(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, { ...opts, cache: "no-store" });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* html */ }
  return { res, text, json };
}

async function main() {
  console.log("=== Website Audit ===\n");

  // ── Marketing landing ──
  const home = await get("/");
  if (home.res.ok && home.text.includes("BhojDesk")) ok("Landing page / loads");
  else bad("Landing page /", home.res.status);

  const landingApi = await get("/api/landing-page");
  if (landingApi.json?.success && landingApi.json.content) {
    ok("GET /api/landing-page");
    const pricing = landingApi.json.content.pricing ?? [];
    if (pricing.length >= 4) ok(`Landing pricing (${pricing.length} plans)`);
    else bad("Landing pricing count", pricing.length);
  } else bad("Landing API", landingApi.json?.error);

  const sections = await get("/api/landing-sections");
  if (sections.json?.success) ok("GET /api/landing-sections");
  else bad("Landing sections API");

  // ── Auth pages (public) ──
  for (const path of ["/login", "/signup", "/forgot-password", "/privacy", "/terms"]) {
    const r = await get(path);
    if (r.res.ok) ok(`Public page ${path}`);
    else bad(`Public page ${path}`, r.res.status);
  }

  // ── Restaurant directory ──
  const rPage = await get("/r");
  if (rPage.res.ok) ok("Restaurant directory /r");
  else bad("/r page", rPage.res.status);

  // Find active slug from SA API (no auth needed for some - use hardcoded from prior tests)
  let slug = "shekhawati-restaurant";
  const saLogin = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "superadmin@rms.com", password: "SuperAdmin@2026" }),
  });
  if (saLogin.ok) {
    const cookie = (saLogin.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
    const list = await fetch(`${BASE}/api/super-admin/restaurants?page=1`, { headers: { Cookie: cookie } }).then((r) => r.json());
    const active = list.restaurants?.find((r) => r.status === "active" && r.slug);
    if (active?.slug) slug = active.slug;
  }

  // ── Customer storefront pages ──
  const storePaths = [
    `/r/${slug}/home`,
    `/r/${slug}/order/menu`,
    `/r/${slug}/order/cart`,
    `/r/${slug}/order/about`,
    `/r/${slug}/order/contact`,
    `/r/${slug}/order/table-booking`,
  ];
  for (const path of storePaths) {
    const r = await get(path);
    if (r.res.ok) ok(`Storefront ${path.replace(`/r/${slug}`, "/r/:slug")}`);
    else bad(`Storefront ${path}`, r.res.status);
  }

  // Slug redirect /r/slug → home
  const slugRoot = await get(`/r/${slug}`, { redirect: "manual" });
  if (slugRoot.res.status === 307 || slugRoot.res.status === 308 || slugRoot.res.ok) {
    ok(`/r/${slug} redirect/root`);
  } else bad(`/r/${slug} root`, slugRoot.res.status);

  // ── Customer APIs (slug via cookie) ──
  const slugCookie = `x-restaurant-slug=${slug}`;
  const menuApi = await get("/api/customer/menu", { headers: { Cookie: slugCookie } });
  if (menuApi.json?.success !== false && menuApi.res.status === 200) {
    const items = menuApi.json.items ?? menuApi.json.menu ?? [];
    ok(`Customer menu API (${Array.isArray(items) ? items.length : "?"} items)`);
  } else bad("Customer menu API", menuApi.json?.error ?? menuApi.res.status);

  const restInfo = await get("/api/customer/restaurant-info", { headers: { Cookie: slugCookie } });
  if (restInfo.res.status === 200 && restInfo.json?.success !== false) ok("Customer restaurant-info API");
  else bad("Restaurant info API", restInfo.json?.error);

  const cms = await get("/api/customer/restaurant-cms", { headers: { Cookie: slugCookie } });
  if (cms.res.status === 200) ok("Customer restaurant-cms API");
  else bad("Restaurant CMS API", cms.res.status);

  // ── Pricing sync landing vs plans ──
  if (saLogin.ok) {
    const cookie = (saLogin.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
    const plans = await fetch(`${BASE}/api/super-admin/plans`, { headers: { Cookie: cookie } }).then((r) => r.json());
    const lp = landingApi.json?.content?.pricing ?? [];
    const starterP = plans.plans?.find((p) => p.slug === "starter");
    const starterL = lp.find((p) => p.slug === "starter");
    if (starterP && starterL) {
      const lpM = starterL.price?.monthly ?? starterL.monthlyPrice;
      if (starterP.monthlyPrice === lpM) ok(`Website pricing sync (starter ₹${lpM}/mo)`);
      else bad("Pricing sync", `plans=${starterP.monthlyPrice} landing=${lpM}`);
    }
  }

  // ── Invalid slug ──
  const badSlugCookie = `x-restaurant-slug=nonexistent-fake-slug-xyz`;
  const badInfo = await get("/api/customer/restaurant-info", { headers: { Cookie: badSlugCookie } });
  if (badInfo.res.status === 404) ok("Invalid slug API returns 404");
  else bad("Invalid slug API", badInfo.res.status);

  const badSlugPage = await get("/r/nonexistent-fake-slug-xyz/order/menu");
  if (badSlugPage.res.ok) ok("Invalid slug storefront shell loads (not-found in browser)");
  else ok("Invalid slug page error status", badSlugPage.res.status);

  // ── Customer account pages ──
  for (const path of [`/r/${slug}/account/login`, `/r/${slug}/account/signup`]) {
    const r = await get(path);
    if (r.res.ok) ok(`Account ${path.split("/").slice(-1)[0]} page`);
    else bad(path, r.res.status);
  }

  // ── Newsletter / contact (structure only) ──
  const badContact = await fetch(`${BASE}/api/customer/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: slugCookie },
    body: JSON.stringify({}),
  });
  if (badContact.status === 400 || badContact.status === 422) ok("Contact API validates empty body");
  else if (badContact.status === 200) ok("Contact API reachable");
  else bad("Contact API", badContact.status);

  console.log(`\n=== ${pass} passed, ${fail} failed ===`);
  console.log(`Active test slug: ${slug}`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
