/**
 * Business email validation — run: node scripts/test-business-email.mjs
 * Requires dev server for API tests: npm run dev
 * MX lookup skipped in this script (set SKIP_EMAIL_MX_CHECK=1).
 */
process.env.SKIP_EMAIL_MX_CHECK = process.env.SKIP_EMAIL_MX_CHECK ?? "1";
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

async function expectSignupReject(email, label) {
  const slug = `biz-test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const res = await fetch(`${BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test Owner",
      email,
      password: "TestPass@123",
      restaurantName: "Test Bistro",
      slug,
    }),
  });
  const data = await res.json().catch(() => ({}));
  const msg = String(data.error ?? "");
  if (!data.success && (res.status === 400 || res.status === 422)) {
    ok(label);
    return;
  }
  fail(label, msg || res.status);
}

async function expectSignupAccept(email, label) {
  const slug = `biz-ok-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const res = await fetch(`${BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test Owner",
      email,
      password: "TestPass@123",
      restaurantName: "Test Bistro Co",
      slug,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (data.success && data.requiresVerification) {
    ok(label);
    return;
  }
  if (!data.success && data.error === "Email already registered.") {
    ok(`${label} (duplicate ok)`);
    return;
  }
  fail(label, data.error ?? res.status);
}

async function expectDuplicateReject(email, label) {
  const slug = `biz-dup-${Date.now()}`;
  const body = {
    name: "Dup Owner",
    email,
    password: "TestPass@123",
    restaurantName: "Dup Bistro",
    slug,
  };
  const first = await fetch(`${BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const firstData = await first.json().catch(() => ({}));
  if (!firstData.success && firstData.error === "Email already registered.") {
    ok(`${label} (already exists)`);
    return;
  }
  const second = await fetch(`${BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, slug: `${slug}-2` }),
  });
  const secondData = await second.json().catch(() => ({}));
  if (!secondData.success && second.status === 409) {
    ok(label);
    return;
  }
  fail(label, secondData.error ?? second.status);
}

console.log("=== Business Email API Tests ===\n");

try {
  await expectSignupReject("owner@gmail.com", "rejects gmail.com");
  await expectSignupReject("chef@yahoo.co.in", "rejects yahoo.co.in");
  await expectSignupReject("owner@outlook.com", "rejects outlook.com");
  await expectSignupReject("owner@hotmail.com", "rejects hotmail.com");
  await expectSignupReject("owner@icloud.com", "rejects icloud.com");
  await expectSignupReject("temp@mailinator.com", "rejects mailinator.com");
  await expectSignupReject("bad-email", "rejects invalid format");
  await expectSignupReject("mahesh@gmaidl.codmd", "rejects typo fake domain");
  await expectSignupReject("user@gmial.com", "rejects gmail typosquat");

  const businessEmail = `owner+${Date.now()}@restaurant.com`;
  await expectSignupAccept(businessEmail, "accepts business domain");
  await expectDuplicateReject(businessEmail, "rejects duplicate registration");
} catch (err) {
  fail("API unreachable — start dev server", err.message);
}

console.log(`\n=== ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
