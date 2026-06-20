/**
 * Real email validation — run: node scripts/test-business-email.mjs
 * Requires dev server: npm run dev
 * MX lookup skipped in this script (SKIP_EMAIL_MX_CHECK=1).
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
  const slug = `email-test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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
  if (!data.success && (res.status === 400 || res.status === 422)) {
    ok(label);
    return;
  }
  fail(label, data.error ?? res.status);
}

async function expectSignupAccept(email, label) {
  const slug = `email-ok-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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

console.log("=== Real Email API Tests ===\n");

try {
  await expectSignupReject("mahesh@gmaidl.codmd", "rejects typo fake domain");
  await expectSignupReject("user@gmial.com", "rejects gmail typosquat");
  await expectSignupReject("bad-email", "rejects invalid format");

  const gmailEmail = `owner+${Date.now()}@gmail.com`;
  await expectSignupAccept(gmailEmail, "accepts gmail.com");
  await expectSignupAccept(`owner+${Date.now()}@restaurant.com`, "accepts company domain");
} catch (err) {
  fail("API unreachable — start dev server", err.message);
}

console.log(`\n=== ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
