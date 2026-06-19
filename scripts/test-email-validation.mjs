/**
 * Email validation across roles — run: node scripts/test-email-validation.mjs
 */
const BASE = process.env.BASE_URL || "http://localhost:3000";

const BAD_EMAILS = ["plain text", "abc", "admin@restaurant.comsssssss", "user@domain.c", "mahesh@gmaidl.codmd", "user@gmial.com"];

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

async function expectReject(label, res) {
  const data = await res.json().catch(() => ({}));
  if (!data.success && (res.status === 400 || res.status === 422)) {
    ok(label);
    return true;
  }
  fail(label, data.error ?? res.status);
  return false;
}

async function main() {
  console.log("=== Email Validation Tests ===\n");

  const admin = await login("admin@restaurant.com", "password123");
  ok("Admin login");

  const me = await fetch(`${BASE}/api/auth/me`, { headers: { Cookie: admin.cookie } }).then((r) => r.json());
  const original = { name: me.user.name, email: me.user.email, phone: me.user.phone ?? "" };

  for (const bad of BAD_EMAILS) {
    const res = await fetch(`${BASE}/api/auth/profile`, {
      method: "PATCH",
      headers: { Cookie: admin.cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ ...original, email: bad }),
    });
    await expectReject(`Profile rejects: ${bad}`, res);
  }

  for (const bad of BAD_EMAILS) {
    const res = await fetch(`${BASE}/api/users/create`, {
      method: "POST",
      headers: { Cookie: admin.cookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Staff",
        email: bad,
        password: "password123",
        role: "waiter",
        phone: "",
      }),
    });
    await expectReject(`Staff create rejects: ${bad}`, res);
  }

  const staffList = await fetch(`${BASE}/api/users/staff`, { headers: { Cookie: admin.cookie } }).then((r) => r.json());
  const waiter = staffList.staff?.find((s) => s.role === "waiter");
  if (waiter) {
    for (const bad of BAD_EMAILS) {
      const res = await fetch(`${BASE}/api/staff/${waiter.id}`, {
        method: "PATCH",
        headers: { Cookie: admin.cookie, "Content-Type": "application/json" },
        body: JSON.stringify({ email: bad }),
      });
      await expectReject(`Staff PATCH rejects: ${bad}`, res);
    }
  } else {
    fail("Staff PATCH tests", "no waiter found");
  }

  for (const bad of BAD_EMAILS) {
    const res = await fetch(`${BASE}/api/customers`, {
      method: "POST",
      headers: { Cookie: admin.cookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Customer",
        phone: "9876543210",
        email: bad,
      }),
    });
    await expectReject(`Customer create rejects: ${bad}`, res);
  }

  for (const bad of BAD_EMAILS) {
    const res = await fetch(`${BASE}/api/customer/auth/signup-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test User", email: bad, password: "password123" }),
    });
    await expectReject(`Customer signup rejects: ${bad}`, res);
  }

  for (const bad of BAD_EMAILS) {
    const res = await fetch(`${BASE}/api/customer/auth/login-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: bad, password: "password123" }),
    });
    await expectReject(`Customer login rejects: ${bad}`, res);
  }

  const cl = await fetch(`${BASE}/api/customers?limit=1`, { headers: { Cookie: admin.cookie } }).then((r) => r.json());
  const cid = cl.customers?.[0]?.id;
  if (cid) {
    for (const bad of BAD_EMAILS) {
      const res = await fetch(`${BASE}/api/customers/${cid}`, {
        method: "PATCH",
        headers: { Cookie: admin.cookie, "Content-Type": "application/json" },
        body: JSON.stringify({ email: bad }),
      });
      await expectReject(`Customer PATCH rejects: ${bad}`, res);
    }
  }

  for (const bad of BAD_EMAILS) {
    const res = await fetch(`${BASE}/api/settings`, {
      method: "PATCH",
      headers: { Cookie: admin.cookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        contact: { phoneNumber: "9876543210", email: bad, address: "Test", googleMapsLink: "" },
      }),
    });
    await expectReject(`Settings contact rejects: ${bad}`, res);
  }

  for (const bad of BAD_EMAILS) {
    const res = await fetch(`${BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Owner",
        email: bad,
        password: "password123",
        restaurantName: "Test Restaurant",
        slug: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      }),
    });
    await expectReject(`Auth signup rejects: ${bad}`, res);
  }

  for (const bad of BAD_EMAILS) {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: bad, password: "x" }),
    });
    await expectReject(`Auth login rejects: ${bad}`, res);
  }

  for (const bad of BAD_EMAILS) {
    const res = await fetch(`${BASE}/api/landing/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test User", email: bad, message: "This is a test message." }),
    });
    await expectReject(`Landing contact rejects: ${bad}`, res);
  }

  for (const bad of BAD_EMAILS) {
    const res = await fetch(`${BASE}/api/customer/newsletter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: bad }),
    });
    await expectReject(`Newsletter rejects: ${bad}`, res);
  }

  const sa = await login("superadmin@rms.com", "SuperAdmin@2026");
  for (const bad of BAD_EMAILS) {
    const res = await fetch(`${BASE}/api/super-admin/restaurants`, {
      method: "POST",
      headers: { Cookie: sa.cookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Bad Email Restaurant",
        slug: `bad-email-${Date.now()}`,
        ownerEmail: bad,
        ownerPassword: "password123",
        plan: "free",
        status: "active",
      }),
    });
    await expectReject(`Super admin restaurant rejects owner: ${bad}`, res);
  }

  await fetch(`${BASE}/api/auth/profile`, {
    method: "PATCH",
    headers: { Cookie: admin.cookie, "Content-Type": "application/json" },
    body: JSON.stringify(original),
  });

  console.log(`\n=== ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
